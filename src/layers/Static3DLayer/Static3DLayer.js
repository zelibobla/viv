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
  domain: { type: 'array', value: [], compare: true },
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
 * This layer wraps XR3DLayer and generates a volumetric rendering. **EXPERIMENTAL**
 * @param {Object} props
 * @param {Array} props.sliderValues List of [begin, end] values to control each channel's ramp function.
 * @param {Array} props.colorValues List of [r, g, b] values for each channel.
 * @param {Array} props.channelIsOn List of boolean values for each channel for whether or not it is visible.
 * @param {number} props.opacity Opacity of the layer.
 * @param {Array} props.domain Override for the possible max/min values (i.e something different than 65535 for uint16/'<u2').
 * @param {Object} props.loader Loader to be used for fetching data.  It must implement/return `getRaster` and `dtype`.
 */
export default class Static3DLayer extends CompositeLayer {
  initializeState() {
    const { loader, z, loaderSelection } = this.props;
    loader
      .getRaster({ z, loaderSelection })
      .then(({ data, width, height, depth }) => {
        this.setState({ data, width, height, depth });
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
        .then(({ data, width, height, depth }) => {
          this.setState({ data, width, height, depth });
        });
    }
  }

  renderLayers() {
    const {
      loader,
      visible,
      opacity,
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
    const { data, width, height, depth } = this.state;
    if (!(width && height)) return null;
    return new XR3DLayer({
      channelData: Promise.resolve({ data, width, height, depth }),
      sliderValues: paddedSliderValues,
      colorValues: paddedColorValues,
      id: `XR-Static-Layer-${0}-${height}-${width}-${0}-${z}-${id}`,
      pickable: false,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      opacity,
      visible,
      dtype
    });
  }
}

Static3DLayer.layerName = 'Static3DLayer';
Static3DLayer.defaultProps = defaultProps;
