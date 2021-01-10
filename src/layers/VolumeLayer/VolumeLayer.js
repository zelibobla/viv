import { CompositeLayer, COORDINATE_SYSTEM } from '@deck.gl/core';
import { TextLayer } from '@deck.gl/layers';
import { Matrix4 } from 'math.gl';
import XR3DLayer from './XR3DLayer';
import { padColorsAndSliders } from '../utils';

const defaultProps = {
  pickable: false,
  coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
  sliderValues: { type: 'array', value: [], compare: true },
  channelIsOn: { type: 'array', value: [], compare: true },
  colorValues: { type: 'array', value: [], compare: true },
  colormap: { type: 'string', value: '', compare: true },
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
  xSlice: { type: 'array', value: [0, 1], compare: true },
  ySlice: { type: 'array', value: [0, 1], compare: true },
  zSlice: { type: 'array', value: [0, 1], compare: true }
};

/**
 * This layer wraps XR3DLayer and generates a volumetric rendering.
 * @param {Object} props
 * @param {Array} props.sliderValues List of [begin, end] values to control each channel's ramp function.
 * @param {Array} props.colorValues List of [r, g, b] values for each channel.
 * @param {Array} props.channelIsOn List of boolean values for each channel for whether or not it is visible.
 * @param {number} props.opacity Opacity of the layer.
 * @param {Array} props.domain Override for the possible max/min values (i.e something different than 65535 for uint16/'<u2').
 * @param {Object} props.loader Loader to be used for fetching data.  It must implement/return `getRaster` and `dtype`.
 */
export default class VolumeLayer extends CompositeLayer {
  updateState({ changeFlags, oldProps, props }) {
    const { propsChanged } = changeFlags;
    const loaderSelectionChanged =
      props.loaderSelection !== oldProps.loaderSelection;
    const loaderChanged =
      typeof propsChanged === 'string' && propsChanged.includes('props.loader');
    if (loaderChanged || loaderSelectionChanged) {
      // Only fetch new data to render if loader has changed
      const { loader, loaderSelection, resolution } = this.props;
      loader
        .getVolume({ loaderSelection, resolution })
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
      colormap,
      z,
      id,
      xSlice,
      ySlice,
      zSlice
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
    if (!(width && height)) {
      const { viewport } = this.context;
      return new TextLayer({
        id: `units-label-layer-${id}`,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        data: [
          {
            text: 'Loading Volume (Firefox/Chrome Only)...',
            position: viewport.position
          }
        ],
        getColor: [220, 220, 220, 255],
        getSize: 25,
        sizeUnits: 'meters',
        sizeScale: 2 ** -viewport.zoom
      });
    }
    // TODO: Figure out how to make this work with the built-in modelMatrix.
    let physicalSizeScalingMatrix = new Matrix4().identity();
    const {
      omexml: { PhysicalSizeZ, PhysicalSizeX, PhysicalSizeY }
    } = loader;
    if (PhysicalSizeZ && PhysicalSizeX && PhysicalSizeY) {
      const ratio = [
        PhysicalSizeX / Math.min(PhysicalSizeZ, PhysicalSizeX, PhysicalSizeY),
        PhysicalSizeY / Math.min(PhysicalSizeZ, PhysicalSizeX, PhysicalSizeY),
        PhysicalSizeZ / Math.min(PhysicalSizeZ, PhysicalSizeX, PhysicalSizeY)
      ];
      physicalSizeScalingMatrix = new Matrix4().scale(ratio);
    }
    if (!height || !width || !depth) return null;
    return new XR3DLayer({
      channelData: { data, width, height, depth },
      sliderValues: paddedSliderValues,
      colorValues: paddedColorValues,
      id: `XR-Static-Layer-${0}-${height}-${width}-${0}-${z}-${id}`,
      pickable: false,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      physicalSizeScalingMatrix,
      opacity,
      visible,
      colormap,
      dtype,
      xSlice,
      ySlice,
      zSlice
    });
  }
}

VolumeLayer.layerName = 'VolumeLayer';
VolumeLayer.defaultProps = defaultProps;
