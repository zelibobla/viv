import React, { useMemo } from 'react'; // eslint-disable-line import/no-unresolved
import { Matrix4 } from 'math.gl';

import VivViewer from './VivViewer';
import { VolumeView } from '../views';
import { RENDERING_MODES } from '../constants';

/**
 * This component provides a volumetric viewer that provides provides volume-ray-casting.
 * @param {Object} props
 * @param {Array} props.sliderValues List of [begin, end] values to control each channel's ramp function.
 * @param {Array} props.colorValues List of [r, g, b] values for each channel.
 * @param {Array} props.channelIsOn List of boolean values for each channel for whether or not it is visible.
 * @param {string} [props.colormap] String indicating a colormap (default: '').  The full list of options is here: https://github.com/glslify/glsl-colormap#glsl-colormap
 * @param {Array} props.loader This data source for the viewer. PixelSource[]. If loader.length > 1, data is assumed to be multiscale.
 * @param {Array} props.loaderSelection Selection to be used for fetching data
 * @param {Array} [props.resolution] Resolution at which you would like to see the volume and load it into memory (0 highest, loader.length -1 the lowest default 0)
 * @param {import('./VivViewer').ViewStateChange} [props.onViewStateChange] Callback that returns the deck.gl view state (https://deck.gl/docs/api-reference/core/deck#onviewstatechange).
 * @param {Array} [props.renderingMode] One of Maximum Intensity Projection, Minimum Intensity Projection, or Additive
 * @param {Matrix4} [props.modelMatrix] A column major affine transformation to be applied to the volume.
 * @param {Array} [props.xSlice] 0-1 interval on which to slice the volume.
 * @param {Array} [props.ySlice] 0-1 interval on which to slice the volume.
 * @param {Array} [props.zSlice] 0-1 interval on which to slice the volume.
 */

const VolumeViewer = props => {
  const {
    loader,
    sliderValues,
    colorValues,
    channelIsOn,
    loaderSelection,
    colormap,
    resolution = loader.length - 1,
    modelMatrix,
    onViewStateChange,
    renderingMode = RENDERING_MODES.ADDITIVE,
    xSlice = [0, 1],
    ySlice = [0, 1],
    zSlice = [0, 1]
  } = props;
  const initialViewState = useMemo(() => {
    const { shape, labels } = loader[resolution];
    const height = shape[labels.indexOf('y')];
    const width = shape[labels.indexOf('x')];
    const depth = shape[labels.indexOf('z')];
    const depthDownsampled = Math.floor(depth / 2 ** resolution);
    let ratio = { x: 1, z: 1, y: 1 };
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
        ratio = {
          x:
            physicalSizeX /
            Math.min(physicalSizeZ, physicalSizeX, physicalSizeY),
          y:
            physicalSizeY /
            Math.min(physicalSizeZ, physicalSizeX, physicalSizeY),
          z:
            physicalSizeZ /
            Math.min(physicalSizeZ, physicalSizeX, physicalSizeY)
        };
      }
    }

    return {
      target: (modelMatrix || new Matrix4()).transformPoint([
        (ratio.x * width) / 2,
        (ratio.y * height) / 2,
        (ratio.z * depthDownsampled) / 2
      ]),
      zoom: -2.0,
      rotationX: 0,
      rotationOrbit: 0
    };
  }, [loader, resolution, modelMatrix]);
  const viewStates = [{ ...initialViewState, id: '3d' }];
  const volumeView = new VolumeView({
    id: '3d',
    target: initialViewState.target
  });
  const layerConfig = {
    loader,
    sliderValues,
    colorValues,
    channelIsOn,
    loaderSelection,
    colormap,
    xSlice,
    ySlice,
    zSlice,
    resolution,
    renderingMode,
    modelMatrix,
    pickable: false
  };
  const views = [volumeView];
  const layerProps = [layerConfig];
  // useDevicePixels false to improve performance: https://deck.gl/docs/developer-guide/performance#common-issues
  return loader ? (
    <VivViewer
      layerProps={layerProps}
      views={views}
      viewStates={viewStates}
      onViewStateChange={onViewStateChange}
      useDevicePixels={false}
    />
  ) : null;
};

export default VolumeViewer;
