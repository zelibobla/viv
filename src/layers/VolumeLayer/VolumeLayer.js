import { CompositeLayer, COORDINATE_SYSTEM } from '@deck.gl/core';
import { TextLayer } from '@deck.gl/layers';
import { Matrix4 } from 'math.gl';
import XR3DLayer from './XR3DLayer';

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
    const loaderChanged =
      typeof propsChanged === 'string' && propsChanged.includes('props.loader');
    const loaderSelectionChanged =
      props.loaderSelection !== oldProps.loaderSelection;
    if (loaderChanged || loaderSelectionChanged) {
      // Only fetch new data to render if loader has changed
      const { loader, loaderSelection = [], resolution = 0 } = this.props;
      let progress = 0;
      const totalRequests =
        (loader[0].shape[loader[0].labels.indexOf('z')] >> resolution) *
        loaderSelection.length;
      console.log(
        loader[0].shape,
        loader[0].shape[loader[0].labels.indexOf('z')],
        1.0 / totalRequests
      );
      const onUpdate = () => {
        progress += 0.5 / totalRequests;
        this.setState({ progress });
      };
      const getVolume = selection =>
        loader[resolution].getVolume({ selection }, onUpdate, 2 ** resolution);
      const dataPromises = loaderSelection.map(getVolume);

      Promise.all(dataPromises).then(volumes => {
        const volume = {
          data: volumes.map(d => d.data),
          width: volumes[0].width,
          height: volumes[0].height,
          depth: volumes[0].depth
        };

        this.setState({ ...volume });
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
      z = 0,
      id,
      xSlice,
      ySlice,
      zSlice,
      renderingMode,
      modelMatrix
    } = this.props;
    const { dtype } = loader[z];
    const { data, width, height, depth, progress } = this.state;
    if (!(width && height)) {
      const { viewport } = this.context;
      return new TextLayer({
        id: `units-label-layer-${id}`,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        data: [
          {
            text: `Loading Volume ${String((progress || 0) * 100).slice(
              0,
              5
            )}% (Firefox/Chrome Only)...`,
            position: viewport.position
          }
        ],
        getColor: [220, 220, 220, 255],
        getSize: 25,
        sizeUnits: 'meters',
        sizeScale: 2 ** -viewport.zoom
      });
    }
    let physicalSizeScalingMatrix = new Matrix4().identity();
    if (
      loader[z]?.meta?.physicalSizes?.x &&
      loader[z]?.meta?.physicalSizes?.y &&
      loader[z]?.meta?.physicalSizes?.z
    ) {
      const {
        physicalSizes: {
          x: { size: physicalSizeX },
          y: { size: physicalSizeY },
          z: { size: physicalSizeZ }
        }
      } = loader[z].meta;
      if (physicalSizeZ && physicalSizeX && physicalSizeY) {
        const ratio = [
          physicalSizeX / Math.min(physicalSizeZ, physicalSizeX, physicalSizeY),
          physicalSizeY / Math.min(physicalSizeZ, physicalSizeX, physicalSizeY),
          physicalSizeZ / Math.min(physicalSizeZ, physicalSizeX, physicalSizeY)
        ];
        physicalSizeScalingMatrix = new Matrix4().scale(ratio);
      }
    }
    if (!height || !width || !depth) return null;
    return new XR3DLayer({
      channelData: { data, width, height, depth },
      sliderValues,
      colorValues,
      domain,
      channelIsOn,
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
      zSlice,
      renderingMode,
      modelMatrix
    });
  }
}

VolumeLayer.layerName = 'VolumeLayer';
VolumeLayer.defaultProps = defaultProps;
