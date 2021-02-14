import React, { useMemo } from 'react';
import { Matrix4 } from 'math.gl';

import VivViewer from './VivViewer';
import { Static3DView } from '../views';
import { RENDERING_MODES } from '../constants';

/**
 * This component provides a component for viewing a 3D volume.
 * @param {Object} props
 * @param {Array} props.sliderValues List of [begin, end] values to control each channel's ramp function.
 * @param {Array} props.colorValues List of [r, g, b] values for each channel.
 * @param {Array} props.channelIsOn List of boolean values for each channel for whether or not it is visible.
 * @param {Object} props.loader Loader to be used for fetching data.  It must have the properies `dtype`, `numLevels`, and `tileSize` and implement `getTile` and `getRaster`.
 * @param {Array} props.loaderSelection Selection to be used for fetching data.
 */

const Static3DViewer = props => {
  const {
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
    modelMatrix,
    renderingMode = RENDERING_MODES.ADDITIVE
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
      zoom: -2.0
    };
  }, [loader, resolution]);
  const viewStates = [{ ...initialViewState, id: '3d' }];
  const threeDView = new Static3DView({
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
    pickable: false,
  };
  const views = [threeDView];
  const layerProps = [layerConfig];
  return loader ? (
    <VivViewer layerProps={layerProps} views={views} viewStates={viewStates} />
  ) : null;
};

export default Static3DViewer;
