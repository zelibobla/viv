import GL from '@luma.gl/constants';
import { Layer, project32, COORDINATE_SYSTEM } from '@deck.gl/core';
import { Model } from '@luma.gl/core';
import { CubeGeometry } from '@luma.gl/engine';
import { Plane } from '@math.gl/culling';

const fs = `
precision highp float;

varying vec2 vUV;
varying vec3 cubeCoords;
uniform vec3 normal;
uniform float distance;

void main(void) {
  if((abs(vUV.x - 0.) < 0.005) || (abs(vUV.y - 0.) < 0.005) || (abs(vUV.x - 1.) < 0.005) || (abs(vUV.y - 1.)) < 0.005) {
    float sideColor = clamp(max(0., sign(dot(normal, cubeCoords) + distance)), 0., 1.);
    gl_FragColor = vec4(sideColor, (1. - sideColor), 0., 1.);
  } else {
    gl_FragColor = vec4(0., 0., 0., 1.);
  }
  gl_FragColor = vec4(1., 1., 0., 1.);
  }
`;
const vs = `

attribute vec2 texCoords;
attribute vec3 positions;
varying vec2 vTexCoord;
varying vec2 vUV;
varying vec3 cubeCoords;

void main(void) {
  gl_Position = project_position_to_clipspace(positions, vec3(0.0), vec3(0.0));
  vUV = texCoords;
  cubeCoords = positions;
}
`;

const defaultProps = {
  coordinateSystem: COORDINATE_SYSTEM.CARTESIAN
};
/**
 * @type {{ new <S extends string[]>(...props: import('../../../types').Viv<LayerProps>[]) }}
 * @ignore
 */
const CubeLayer = class extends Layer {
  /**
   * This function compiles the shaders and the projection module.
   */
  // eslint-disable-next-line class-methods-use-this
  getShaders() {
    return {
      fs,
      vs,
      modules: [project32]
    };
  }

  initializeState() {
    const { gl } = this.context;
    this.setState({ model: this._getModel(gl) });
    const attributeManager = this.getAttributeManager();
    const noAlloc = true;
    attributeManager.add({
      positions: {
        size: 3,
        noAlloc
      },
      texCoords: {
        size: 2,
        noAlloc
      }
    });
  }

  /**
   * This function creates the luma.gl model.
   */
  _getModel(gl) {
    if (!gl) {
      return null;
    }
    return new Model(gl, {
      ...this.getShaders(),
      id: this.props.id + '-model',
      isInstanced: true,
      geometry: new CubeGeometry()
    });
  }

  draw({ uniforms }) {
    const { model } = this.state;
    const plane = new Plane({ normal: [0.5, 1, 0.2], distance: 0.2 });
    console.log('drawing!');
    if (model) {
      model
        .setUniforms({
          ...uniforms,
          normal: plane.normal,
          distance: plane.distance
        })
        .draw();
    }
  }
};

CubeLayer.layerName = 'CubeLayer';
CubeLayer.defaultProps = defaultProps;
export default CubeLayer;
