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
    zSlice
  } = props;
  const initialViewState = useMemo(() => {
    const {
      isPyramid,
      omexml: { SizeZ, SizeX, SizeY }
    } = loader;
    const scale = getScaleForSize({ loader });
    return {
      target: [
        (isPyramid ? SizeX >> scale : SizeX) / 2,
        (isPyramid ? SizeY >> scale : SizeY) / 2,
        (SizeZ >> scale) / 2
      ],
      zoom: -2
    };
  }, [loader]);
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
    zSlice
  };
  const views = [detailView];
  const layerProps = [layerConfig];
  return loader ? <VivViewer layerProps={layerProps} views={views} /> : null;
};

export default Static3DViewer;
