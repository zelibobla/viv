/* eslint-disable prefer-destructuring */

/* This is largely an adaptation of Will Usher's excellent blog post/code:
https://github.com/Twinklebear/webgl-volume-raycaster

The major changes are:

- Code has been adapted to the luma.gl/deck.gl framework instead of more-or-less pure WebGL.

- We use a coordinate system that will allow overlays/other figures on our vertex shader/javascript.  
Will implements everything in a unit cube (?) centered at the origin.  Our center is at the midpoint of
the dimensions of the volume which will allow for pixel-space overlays.

- We use an OrbitView which is a similar camera to what Will has, but stops gimbal lock from happening
by stopping full rotations whereas Will implements a camera that allows for full rotations without gimbal lock.
We could probably implement a similar camera in deck.gl but that is for another time.

- We have a multi-channel use case and have a few tweaks in the fragment shader to handle that.

- We need to handle different texture datatypes (Will uses R8 data?).

- Will implements a sampling rate calculation on the fragment shader 
that we do not to improve performance as the frame rate drops.

- Will uses a colormap via a sampled texture, which is not a bad idea, but is not the direction we have gone in so far.
So, if we want 3d colormaps, we'll need another shader.

- 
*/
import GL from '@luma.gl/constants';
import { COORDINATE_SYSTEM, Layer, project32 } from '@deck.gl/core';
import { Model, Geometry, Texture3D, setParameters } from '@luma.gl/core';
import vs from './xr-layer-vertex.glsl';
import fsColormap from './xr-layer-fragment-colormap.glsl';
import fs from './xr-layer-fragment.glsl';
import { DTYPE_VALUES } from '../../constants';

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

const defaultProps = {
  pickable: false,
  coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
  channelData: { type: 'object', value: {}, async: true },
  colorValues: { type: 'array', value: [], compare: true },
  sliderValues: { type: 'array', value: [], compare: true },
  opacity: { type: 'number', value: 1, compare: true },
  dtype: { type: 'string', value: '<u2', compare: true },
  colormap: { type: 'string', value: '', compare: true },
  xSlice: { type: 'array', value: [0, 1], compare: true },
  ySlice: { type: 'array', value: [0, 1], compare: true },
  zSlice: { type: 'array', value: [0, 1], compare: true },
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
  }

  /**
   * This function compiles the shaders and the projection module.
   */
  getShaders() {
    const { colormap } = this.props;
    const fragmentShaderColormap = colormap
      ? fsColormap.replace('colormapFunction', colormap)
      : fs;
    return super.getShaders({
      vs,
      fs: fragmentShaderColormap,
      modules: [project32]
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
    if (changeFlags.extensionsChanged || props.colormap !== oldProps.colormap) {
      const { gl } = this.context;
      if (this.state.model) {
        this.state.model.delete();
      }
      this.setState({ model: this._getModel(gl) });
    }
    if (props.channelData !== oldProps.channelData && props.channelData.data) {
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
      }),
    });
  }

  /**
   * This function runs the shaders and draws to the canvas
   */
  draw({ uniforms }) {
    const { textures, model, volDims } = this.state;
    const { sliderValues, colorValues, xSlice, ySlice, zSlice } = this.props;
    if (textures && model) {
      model
        .setUniforms({
          ...uniforms,
          ...textures,
          sliderValues,
          colorValues,
          dimensions: new Float32Array(volDims),
          xSlice: new Float32Array(xSlice),
          ySlice: new Float32Array(ySlice),
          zSlice: new Float32Array(zSlice)
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
      this.setState({ textures, volDims: [width, height, depth] });
    }
  }

  /**
   * This function creates textures from the data
   */
  dataToTexture(data, width, height, depth) {
    const { dtype } = this.props;
    const { format, dataFormat, type } = DTYPE_VALUES[dtype];
    const texture = new Texture3D(this.context.gl, {
      width,
      height,
      depth,
      data,
      // ? Seems to be a luma.gl bug.  Looks like Texture2D is wrong but these are flipped somewhere.
      format: dataFormat,
      dataFormat: format,
      type,
      mmipmaps: false,
      parameters: {
        // NEAREST for integer data
        [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
        [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
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
