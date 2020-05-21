import { CompositeLayer, COORDINATE_SYSTEM } from '@deck.gl/core';
import XR3DLayer from './XR3DLayer';
import { padColorsAndSliders } from '../utils';

const defaultProps = {
  pickable: false,
  coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
  sliderValues: { type: 'array', value: [], compare: true },
  channelIsOn: { type: 'array', value: [], compare: true },
  colorValues: { type: 'array', value: [], compare: true },
  loaderSelection: { type: 'array', value: undefined, compare: true },
  colormap: { type: 'string', value: '', compare: true },
  domain: { type: 'array', value: [], compare: true },
  translate: { type: 'array', value: [0, 0], compare: true },
  scale: { type: 'number', value: 1, compare: true },
  loader: {
    type: 'object',
    value: {
      getRaster: async () => ({ data: [], height: 0, width: 0 }),
      dtype: '<u2'
    },
    compare: true
  },
  z: { type: 'number', value: 0, compare: true }
};

/**
 * This layer wraps XRLayer and generates a static image
 * @param {Object} props
 * @param {Array} props.sliderValues List of [begin, end] values to control each channel's ramp function.
 * @param {Array} props.colorValues List of [r, g, b] values for each channel.
 * @param {Array} props.channelIsOn List of boolean values for each channel for whether or not it is visible.
 * @param {number} props.opacity Opacity of the layer.
 * @param {string} props.colormap String indicating a colormap (default: '').  The full list of options is here: https://github.com/glslify/glsl-colormap#glsl-colormap
 * @param {Array} props.domain Override for the possible max/min values (i.e something different than 65535 for uint16/'<u2').
 * @param {string} props.viewportId Id for the current view.
 * @param {Array} props.translate Translate transformation to be applied to the bounds after scaling.
 * @param {number} props.scale Scaling factor for this layer to be used against the dimensions of the loader's `getRaster`.
 * @param {Object} props.loader Loader to be used for fetching data.  It must implement/return `getRaster` and `dtype`.
 */
export default class Static3DLayer extends CompositeLayer {
  initializeState() {
    const { loader, z, loaderSelection } = this.props;
    loader.getRaster({ z, loaderSelection }).then(({ data, width, height }) => {
      this.setState({ data, width, height, zSize: 12 });
    });
  }

  updateState({ changeFlags }) {
    const { propsChanged } = changeFlags;
    if (
      typeof propsChanged === 'string' &&
      propsChanged.includes('props.loader')
    ) {
      // Only fetch new data to render if loader has changed
      const { loader, z, loaderSelection } = this.props;
      loader
        .getRaster({ z, loaderSelection })
        .then(({ data, width, height }) => {
          this.setState({ data, width, height, zSize: 12 });
        });
    }
  }

  renderLayers() {
    const {
      loader,
      visible,
      opacity,
      colormap,
      sliderValues,
      colorValues,
      channelIsOn,
      domain,
      z,
      id
    } = this.props;
    const { dtype } = loader;
    const { paddedSliderValues, paddedColorValues } = padColorsAndSliders({
      sliderValues,
      colorValues,
      channelIsOn,
      domain,
      dtype
    });
    const { data, width, height, zSize } = this.state;
    if (!(width && height)) return null;
    return new XR3DLayer({
      channelData: Promise.resolve({ data, width, height, zSize }),
      sliderValues: paddedSliderValues,
      colorValues: paddedColorValues,
      id: `XR-Static-Layer-${0}-${height}-${width}-${0}-${z}-${id}`,
      pickable: false,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      opacity,
      visible,
      dtype,
      colormap
    });
  }
}

Static3DLayer.layerName = 'Static3DLayer';
Static3DLayer.defaultProps = defaultProps;
