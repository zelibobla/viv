import React, { useMemo } from 'react';
import VivViewer from './VivViewer';
import { Static3DView } from '../views';
import { getScaleForSize } from '../loaders/utils';

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
    resolution
  } = props;
  const initialViewState = useMemo(() => {
    const {
      isPyramid,
      omexml: {
        SizeZ,
        SizeX,
        SizeY,
        PhysicalSizeZ,
        PhysicalSizeX,
        PhysicalSizeY
      }
    } = loader;
    let ratio = { x: 1, z: 1, y: 1 };
    if (PhysicalSizeZ && PhysicalSizeX && PhysicalSizeY) {
      ratio = {
        x:
          PhysicalSizeX / Math.min(PhysicalSizeZ, PhysicalSizeX, PhysicalSizeY),
        y:
          PhysicalSizeY / Math.min(PhysicalSizeZ, PhysicalSizeX, PhysicalSizeY),
        z: PhysicalSizeZ / Math.min(PhysicalSizeZ, PhysicalSizeX, PhysicalSizeY)
      };
    }
    return {
      target: [
        (ratio.x * (isPyramid ? SizeX >> resolution : SizeX)) / 2,
        (ratio.y * (isPyramid ? SizeY >> resolution : SizeY)) / 2,
        (ratio.z * (SizeZ >> resolution)) / 2
      ],
      zoom: -2
    };
  }, [loader, resolution]);
  const detailViewState = { ...initialViewState, id: 'detail' };
  const detailView = new Static3DView({ initialViewState: detailViewState });
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
    resolution
  };
  const views = [detailView];
  const layerProps = [layerConfig];
  return loader ? <VivViewer layerProps={layerProps} views={views} /> : null;
};

export default Static3DViewer;
