/* eslint-disable prefer-destructuring */

/* This is largely an adaptation of Will Usher's excellent blog post/code:
https://github.com/Twinklebear/webgl-volume-raycaster

The major changes are:

- Code has been adapted to the luma.gl/deck.gl framework instead of more-or-less pure WebGL.

- We use a coordinate system that will allow overlays/other figures on our vertex shader/javascript.  
Will implements everything in a unit cube (I think?) centered at the origin.  Our center is at the midpoint of
the dimensions of the volume which will allow for pixel-space overlays (i.e the top left back corner is the origin).

- We use an OrbitView which is a similar camera to what Will has, but stops gimbal lock from happening
by stopping full rotations whereas Will implements a camera that allows for full rotations without gimbal lock.
We could probably implement a similar camera in deck.gl but that is for another time.

- We have a multi-channel use case and have a few tweaks in the fragment shader to handle that.

- We need to handle different texture datatypes (Will uses R8 data?).

- Will uses a colormap via a sampled texture, which is not a bad idea, but is not the direction we have gone in so far.
So, if we want 3d colormaps, we'll need another shader.

- We allow for multiple rendering settings (Max/Min Int. Proj., Additive, etc.)
*/
import GL from '@luma.gl/constants';
import { COORDINATE_SYSTEM, Layer, project32 } from '@deck.gl/core';
import { Model, Geometry, Texture3D, setParameters } from '@luma.gl/core';
import { Matrix4 } from 'math.gl';
import vs from './xr-layer-vertex.glsl';
import fsColormap from './xr-layer-fragment-colormap.glsl';
import fs from './xr-layer-fragment.glsl';
import channels from './channel-intensity-module';
import { padColorsAndSliders } from '../../utils';
import {
  DTYPE_VALUES,
  COLORMAPS,
  RENDERING_MODES as RENDERING_NAMES
} from '../../../constants';

// prettier-ignore
const CUBE_STRIP = [
	1, 1, 0,
	0, 1, 0,
	1, 1, 1,
	0, 1, 1,
	0, 0, 1,
	0, 1, 0,
	0, 0, 0,
	1, 1, 0,
	1, 0, 0,
	1, 1, 1,
	1, 0, 1,
	0, 0, 1,
	1, 0, 0,
	0, 0, 0
];

const RENDERING_MODES = {
  [RENDERING_NAMES.MAX_INTENSITY_PROJECTION]: {
    _BEFORE_RENDER: `\
      float maxVals[6] = float[6](-1.0, -1.0, -1.0, -1.0, -1.0, -1.0);
    `,
    _RENDER: `\
    
      float intensityArray[6] = float[6](intensityValue0, intensityValue1, intensityValue2, intensityValue3, intensityValue4, intensityValue5);

      for(int i = 0; i < 6; i++) {
        if(intensityArray[i] > maxVals[i]) {
          maxVals[i] = intensityArray[i];
        }
      }
    `,
    _AFTER_RENDER: `\
      vec3 rgbCombo = vec3(0.0);
      for(int i = 0; i < 6; i++) {
        vec3 hsvCombo = rgb2hsv(vec3(colorValues[i]));
        hsvCombo = vec3(hsvCombo.xy, maxVals[i]);
        rgbCombo += hsv2rgb(hsvCombo);
      }
      color = vec4(rgbCombo, 1.0);
    `
  },
  [RENDERING_NAMES.MIN_INTENSITY_PROJECTION]: {
    _BEFORE_RENDER: `\
      float minVals[6] = float[6](1. / 0., 1. / 0., 1. / 0., 1. / 0., 1. / 0., 1. / 0.);
    `,
    _RENDER: `\
    
      float intensityArray[6] = float[6](intensityValue0, intensityValue1, intensityValue2, intensityValue3, intensityValue4, intensityValue5);

      for(int i = 0; i < 6; i++) {
        if(intensityArray[i] < minVals[i]) {
          minVals[i] = intensityArray[i];
        }
      }
    `,
    _AFTER_RENDER: `\
      vec3 rgbCombo = vec3(0.0);
      for(int i = 0; i < 6; i++) {
        vec3 hsvCombo = rgb2hsv(vec3(colorValues[i]));
        hsvCombo = vec3(hsvCombo.xy, minVals[i]);
        rgbCombo += hsv2rgb(hsvCombo);
      }
      color = vec4(rgbCombo, 1.0);
    `
  },
  [RENDERING_NAMES.ADDITIVE]: {
    _BEFORE_RENDER: ``,
    _RENDER: `\
      vec3 rgbCombo = vec3(0.0);
      vec3 hsvCombo = vec3(0.0);
      float intensityArray[6] = float[6](intensityValue0, intensityValue1, intensityValue2, intensityValue3, intensityValue4, intensityValue5);
      float total = 0.0;
      for(int i = 0; i < 6; i++) {
        float intensityValue = intensityArray[i];
        hsvCombo = rgb2hsv(vec3(colorValues[i]));
        hsvCombo = vec3(hsvCombo.xy, intensityValue);
        rgbCombo += hsv2rgb(hsvCombo);
        total += intensityValue;
      }
      // Do not go past 1 in opacity.
      total = min(total, 1.0);
      vec4 val_color = vec4(rgbCombo, total);
      // Opacity correction
      val_color.a = 1.0 - pow(1.0 - val_color.a, 1.0);
      color.rgb += (1.0 - color.a) * val_color.a * val_color.rgb;
      color.a += (1.0 - color.a) * val_color.a;
      if (color.a >= 0.95) {
        break;
      }
    `,
    _AFTER_RENDER: ``
  }
};

const defaultProps = {
  pickable: false,
  coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
  channelData: { type: 'object', value: {}, compare: true },
  colorValues: { type: 'array', value: [], compare: true },
  sliderValues: { type: 'array', value: [], compare: true },
  opacity: { type: 'number', value: 1, compare: true },
  dtype: { type: 'string', value: '<u2', compare: true },
  colormap: { type: 'string', value: '', compare: true },
  xSlice: { type: 'array', value: [0, 1], compare: true },
  ySlice: { type: 'array', value: [0, 1], compare: true },
  zSlice: { type: 'array', value: [0, 1], compare: true },
  renderingMode: {
    type: 'string',
    value: RENDERING_NAMES.ADDITIVE,
    compare: true
  }
};
/**
 * This is the 3D rendering layer.
 */
export default class XR3DLayer extends Layer {
  initializeState() {
    const { gl } = this.context;
    this.setState({
      model: this._getModel(gl)
    });
    // Needed to only render the back polygons.
    setParameters(gl, {
      [GL.CULL_FACE]: true,
      [GL.CULL_FACE_MODE]: GL.FRONT
    });
    // This tells WebGL how to read row data from the texture.  For example, the default here is 4 (i.e for RGBA, one byte per channel) so
    // each row of data is expected to be a multiple of 4.  This setting (i.e 1) allows us to have non-multiple-of-4 row sizes.  For example, for 2 byte (16 bit data),
    // we could use 2 as the value and it would still work, but 1 also works fine (and is more flexible for 8 bit - 1 byte - textures as well).
    // https://stackoverflow.com/questions/42789896/webgl-error-arraybuffer-not-big-enough-for-request-in-case-of-gl-luminance
    gl.pixelStorei(GL.UNPACK_ALIGNMENT, 1);
    gl.pixelStorei(GL.PACK_ALIGNMENT, 1);
  }

  /**
   * This function compiles the shaders and the projection module.
   */
  getShaders() {
    const { colormap, renderingMode } = this.props;
    const fragmentShaderColormap = colormap ? fsColormap : fs;
    const { _BEFORE_RENDER, _RENDER, _AFTER_RENDER } = RENDERING_MODES[
      renderingMode
    ];
    // Always include viridis so shaders compile
    const discardColormaps = COLORMAPS.filter(
      i => i !== (colormap || 'viridis')
    ).map(i => i.replace(/-/g, '_'));
    const discardRegex = new RegExp(
      `vec4 (${discardColormaps.join(
        '(_([0-9]*))?|'
      )})\\(float x_[0-9]+\\){([^}]+)}`,
      'g'
    );
    const channelsModules = {
      ...channels,
      fs: channels.fs.replace(discardRegex, ''),
      defines: {
        _COLORMAP_FUNCTION: colormap || 'viridis'
      }
    };
    return super.getShaders({
      vs,
      fs: fragmentShaderColormap
        .replace('_BEFORE_RENDER', _BEFORE_RENDER)
        .replace('_RENDER', _RENDER)
        .replace('_AFTER_RENDER', _AFTER_RENDER),
      defines: {
        _COLORMAP_FUNCTION: colormap || 'viridis'
      },
      modules: [project32, channelsModules]
    });
  }

  /**
   * This function finalizes state by clearing all textures from the WebGL context
   */
  finalizeState() {
    super.finalizeState();

    if (this.state.textures) {
      Object.values(this.state.textures).forEach(tex => tex && tex.delete());
    }
  }

  /**
   * This function updates state by retriggering model creation (shader compilation and attribute binding)
   * and loading any textures that need be loading.
   */
  updateState({ props, oldProps, changeFlags }) {
    // setup model first
    if (
      changeFlags.extensionsChanged ||
      props.colormap !== oldProps.colormap ||
      props.renderingMode !== oldProps.renderingMode
    ) {
      const { gl } = this.context;
      if (this.state.model) {
        this.state.model.delete();
      }
      this.setState({ model: this._getModel(gl) });
    }
    if (
      props.channelData &&
      props?.channelData?.data !== oldProps?.channelData?.data
    ) {
      this.loadTexture(props.channelData);
    }
  }

  /**
   * This function creates the luma.gl model.
   */
  // eslint-disable-next-line class-methods-use-this
  _getModel(gl) {
    if (!gl) {
      return null;
    }
    return new Model(gl, {
      ...this.getShaders(),
      geometry: new Geometry({
        drawMode: gl.TRIANGLE_STRIP,
        attributes: {
          positions: new Float32Array(CUBE_STRIP)
        }
      })
    });
  }

  /**
   * This function runs the shaders and draws to the canvas
   */
  draw({ uniforms }) {
    const { textures, model, volDims } = this.state;
    const {
      sliderValues,
      colorValues,
      xSlice,
      ySlice,
      zSlice,
      modelMatrix,
      channelIsOn,
      domain,
      dtype
    } = this.props;
    const {
      viewMatrix,
      viewMatrixInverse,
      projectionMatrix,
    } = this.context.viewport;
    if (textures && model && volDims) {

    const { paddedSliderValues, paddedColorValues } = padColorsAndSliders({
      sliderValues,
      colorValues,
      channelIsOn,
      domain,
      dtype
    });
      model
        .setUniforms({
          ...uniforms,
          ...textures,
          sliderValues: paddedSliderValues,
          colorValues: paddedColorValues,
          xSlice: new Float32Array(xSlice),
          ySlice: new Float32Array(ySlice),
          zSlice: new Float32Array(zSlice),
          eye_pos: new Float32Array([
            viewMatrixInverse[12],
            viewMatrixInverse[13],
            viewMatrixInverse[14]
          ]),
          view: viewMatrix,
          proj: projectionMatrix,
          scale: new Matrix4().scale(volDims),
          model: modelMatrix || new Matrix4()
        })
        .draw();
    }
  }

  /**
   * This function loads all textures from incoming resolved promises/data from the loaders by calling `dataToTexture`
   */
  loadTexture(channelData) {
    const textures = {
      volume0: null,
      volume1: null,
      volume2: null,
      volume3: null,
      volume4: null,
      volume5: null
    };
    if (this.state.textures) {
      Object.values(this.state.textures).forEach(tex => tex && tex.delete());
    }
    if (
      channelData &&
      Object.keys(channelData).length > 0 &&
      channelData.data
    ) {
      const { height, width, depth } = channelData;
      channelData.data.forEach((d, i) => {
        textures[`volume${i}`] = this.dataToTexture(d, width, height, depth);
      }, this);
      this.setState({
        textures,
        volDims: this.props.physicalSizeScalingMatrix.transformPoint([
          width,
          height,
          depth
        ])
      });
    }
  }

  /**
   * This function creates textures from the data
   */
  dataToTexture(data, width, height, depth) {
    const { format, dataFormat, type } = DTYPE_VALUES.Float32;
    const texture = new Texture3D(this.context.gl, {
      width,
      height,
      depth,
      data: new Float32Array(data),
      // ? Seems to be a luma.gl bug.  Looks like Texture2D is wrong but these are flipped somewhere.
      format: dataFormat,
      dataFormat: format,
      type,
      mipmaps: false,
      parameters: {
        // NEAREST for integer data
        [GL.TEXTURE_MIN_FILTER]: GL.LINEAR,
        [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
        // CLAMP_TO_EDGE to remove tile artifacts
        [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
        [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
        [GL.TEXTURE_WRAP_R]: GL.CLAMP_TO_EDGE
      }
    });
    return texture;
  }
}

XR3DLayer.layerName = 'XR3DLayer';
XR3DLayer.defaultProps = defaultProps;
