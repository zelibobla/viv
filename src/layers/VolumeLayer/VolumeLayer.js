import { CompositeLayer, COORDINATE_SYSTEM } from '@deck.gl/core';
import { TextLayer } from '@deck.gl/layers';
import { Matrix4 } from 'math.gl';
import XR3DLayer from './XR3DLayer';
import { RENDERING_MODES } from '../../constants';

const defaultProps = {
  pickable: false,
  coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
  sliderValues: { type: 'array', value: [], compare: true },
  channelIsOn: { type: 'array', value: [], compare: true },
  colorValues: { type: 'array', value: [], compare: true },
  colormap: { type: 'string', value: '', compare: true },
  loaderSelection: { type: 'array', value: [], compare: true },
  resolution: { type: 'number', value: 0, compare: true },
  domain: { type: 'array', value: [], compare: true },
  loader: {
    type: 'object',
    value: [
      {
        getRaster: async () => ({ data: [], height: 0, width: 0 }),
        dtype: 'Uint16',
        shape: [1],
        labels: ['z']
      }
    ],
    compare: true
  },
  xSlice: { type: 'array', value: [0, 1], compare: true },
  ySlice: { type: 'array', value: [0, 1], compare: true },
  zSlice: { type: 'array', value: [0, 1], compare: true },
  renderingMode: {
    type: 'string',
    value: RENDERING_MODES.MAX_INTENSITY_PROJECTION,
    compare: true
  }
};

/**
 * @typedef LayerProps
 * @type {Object}
 * @property {Array.<Array.<number>>} sliderValues List of [begin, end] values to control each channel's ramp function.
 * @property {Array.<Array.<number>>} colorValues List of [r, g, b] values for each channel.
 * @property {Array.<Array.<boolean>>} channelIsOn List of boolean values for each channel for whether or not it is visible.
 * @property {Array} loader PixelSource. Represents an N-dimensional image.
 * @property {Array} loaderSelection Selection to be used for fetching data.
 * @property {number=} opacity Opacity of the layer.
 * @property {string=} colormap String indicating a colormap (default: '').  The full list of options is here: https://github.com/glslify/glsl-colormap#glsl-colormap
 * @property {Array.<Array.<number>>=} domain Override for the possible max/min values (i.e something different than 65535 for uint16/'<u2').
 * @param {number=} resolution Resolution at which you would like to see the volume and load it into memory (0 highest, loader.length -1 the lowest default 0)
 * @param {string=} renderingMode One of Maximum Intensity Projection, Minimum Intensity Projection, or Additive
 * @param {Object=} modelMatrix A column major affine transformation to be applied to the volume.
 * @param {Array.<number>=} xSlice 0-1 interval on which to slice the volume.
 * @param {Array.<number>=} ySlice 0-1 interval on which to slice the volume.
 * @param {Array.<number>=} zSlice 0-1 interval on which to slice the volume.
 * @property {function=} onViewportLoad Function that gets called when the data in the viewport loads.
 */
export default class VolumeLayer extends CompositeLayer {
  updateState({ changeFlags, oldProps, props }) {
    const { propsChanged } = changeFlags;
    const loaderChanged =
      typeof propsChanged === 'string' && propsChanged.includes('props.loader');
    const loaderSelectionChanged =
      props.loaderSelection !== oldProps.loaderSelection;
    // Only fetch new data to render if loader has changed
    if (loaderChanged || loaderSelectionChanged) {
      const {
        loader,
        loaderSelection = [],
        resolution,
        onViewportLoad
      } = this.props;
      let progress = 0;
      const totalRequests =
        // eslint-disable-next-line no-bitwise
        (loader[0].shape[loader[0].labels.indexOf('z')] >> resolution) *
        loaderSelection.length;
      const onUpdate = () => {
        progress += 0.5 / totalRequests;
        this.setState({ progress });
      };
      const getVolume = selection =>
        loader[resolution].getVolume({ selection }, onUpdate, 2 ** resolution);
      const dataPromises = loaderSelection.map(getVolume);

      Promise.all(dataPromises).then(volumes => {
        if (onViewportLoad) {
          onViewportLoad(volumes);
        }
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
      id,
      xSlice,
      ySlice,
      zSlice,
      resolution,
      renderingMode,
      modelMatrix
    } = this.props;
    const { dtype } = loader[resolution];
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
      loader[resolution]?.meta?.physicalSizes?.x &&
      loader[resolution]?.meta?.physicalSizes?.y &&
      loader[resolution]?.meta?.physicalSizes?.z
    ) {
      const {
        physicalSizes: {
          x: { size: physicalSizeX },
          y: { size: physicalSizeY },
          z: { size: physicalSizeZ }
        }
      } = loader[resolution].meta;
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
      id: `XR-Static-Layer-${0}-${height}-${width}-${0}-${resolution}-${id}`,
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
