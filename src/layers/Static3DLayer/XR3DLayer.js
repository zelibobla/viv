/* eslint-disable prefer-destructuring */
// A lot of this codes inherits paradigms form DeckGL that
// we live in place for now, hence some of the not-destructuring
import GL from '@luma.gl/constants';
import { COORDINATE_SYSTEM, Layer, project32 } from '@deck.gl/core';
import { Model, Geometry, Texture3D } from '@luma.gl/core';
import { vs } from './xr-layer-vertex';
import { fs } from './xr-layer-fragment';
import { DTYPE_VALUES } from '../../constants';

const defaultProps = {
  pickable: false,
  coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
  channelData: { type: 'object', value: {}, async: true },
  bounds: { type: 'array', value: [0, 0, 1, 1], compare: true },
  colorValues: { type: 'array', value: [], compare: true },
  sliderValues: { type: 'array', value: [], compare: true },
  tileSize: { type: 'number', value: 0, compare: true },
  opacity: { type: 'number', value: 1, compare: true },
  dtype: { type: 'string', value: '<u2', compare: true },
  colormapImage: { type: 'object', value: {}, async: true }
};
/**
 * This layer serves as the workhorse of the project, handling all the rendering.  Much of it is
 * adapted from BitmapLayer in DeckGL.
 */
export default class XR3DLayer extends Layer {
  initializeState() {
    const { gl } = this.context;
    this.setState({
      model: this._getModel(gl)
    });
  }

  /**
   * This function chooses a shader (colormapping or not) and
   * replaces `usampler` with `sampler` if the data is not an unsigned integer
   */
  getShaders() {
    return super.getShaders({
      vs,
      fs,
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
  _getModel(gl) {
    if (!gl) {
      return null;
    }
    return new Model(gl, {
      vs,
      fs,
      geometry: new Geometry({
        drawMode: gl.TRIANGLE_STRIP,
        attributes: {
          positions: new Float32Array([
            1,
            1,
            0,
            0,
            1,
            0,
            1,
            1,
            1,
            0,
            1,
            1,
            0,
            0,
            1,
            0,
            1,
            0,
            0,
            0,
            0,
            1,
            1,
            0,
            1,
            0,
            0,
            1,
            1,
            1,
            1,
            0,
            1,
            0,
            0,
            1,
            1,
            0,
            0,
            0,
            0,
            0
          ])
        }
      }),
      // this in theory can be coupled with sampling rate to make interaction smoother.
      uniforms: {
        dt_scale: 1.0
      }
    });
  }

  /**
   * This function runs the shaders and draws to the canvas
   */
  draw({ uniforms }) {
    const { textures, model, volDims } = this.state;
    const { sliderValues, colorValues } = this.props;
    if (textures && model) {
      const longestAxis = Math.max(
        volDims[0],
        Math.max(volDims[1], volDims[2])
      );

      const volScale = [
        volDims[0] / longestAxis,
        volDims[1] / longestAxis,
        volDims[2] / longestAxis
      ];
      model
        .setUniforms({
          ...uniforms,
          ...textures,
          sliderValues,
          colorValues,
          volume_scale: new Float32Array(volScale),
          instanceCenter: new Float32Array(volDims).map(i => i / 2),
          dimensions: new Float32Array(volDims)
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
