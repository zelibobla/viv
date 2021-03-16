import GL from '@luma.gl/constants';
import XRLayer from '../XRLayer';
import BitmapLayer from '../BitmapLayer';
import { getImageSize, isInterleaved } from '../../loaders/utils';
import { range } from '../utils';

export function renderSubLayers(props) {
  const {
    bbox: { left, top, right, bottom },
    x,
    y,
    z
  } = props.tile;
  const {
    colorValues,
    sliderValues,
    channelIsOn,
    visible,
    opacity,
    data,
    colormap,
    dtype,
    id,
    onHover,
    pickable,
    unprojectLensBounds,
    isLensOn,
    lensSelection,
    onClick,
    loader,
    modelMatrix
  } = props;
  // Only render in positive coorinate system
  if ([left, bottom, right, top].some(v => v < 0) || !data) {
    return null;
  }
  const base = loader[0];
  const { height, width } = getImageSize(base);
  // Tiles are exactly fitted to have height and width such that their bounds match that of the actual image (not some padded version).
  // Thus the right/bottom given by deck.gl are incorrect since they assume tiles are of uniform sizes, which is not the case for us.
  const bounds = [
    left,
    data.height < base.tileSize ? height : bottom,
    data.width < base.tileSize ? width : right,
    top
  ];
  if (isInterleaved(base)) {
    const { photometricInterpretation } = base;
    return new BitmapLayer(props, {
      image: data,
      photometricInterpretation,
      // Shared props with XRLayer:
      bounds,
      id: `tile-sub-layer-${bounds}-${id}`,
      tileId: { x, y, z },
      onHover,
      pickable,
      onClick,
      modelMatrix,
      opacity,
      visible
    });
  }
  const { maxChannels: maxChannelsPerXRLayer } = XRLayer;
  const numLayers = Math.ceil(data.data.length / maxChannelsPerXRLayer);
  const shouldRenderOnlyOneLayer = numLayers > 1 && colormap;
  if (shouldRenderOnlyOneLayer) {
    console.warn(
      'Colormapping is not supported when used with more than six layers. All Layers after the sixth will not be rendered.'
    );
  }
  const sliceForLayer = (arr, i) =>
    arr.slice(i * maxChannelsPerXRLayer, (i + 1) * maxChannelsPerXRLayer);
  const layers = range(shouldRenderOnlyOneLayer ? 1 : numLayers).map(i => {
    return new XRLayer(props, {
      channelData: {
        ...data,
        data: sliceForLayer(data.data, i)
      },
      // Uncomment to help debugging - shades the tile being hovered over.
      // autoHighlight: true,
      // highlightColor: [80, 80, 80, 50],
      data: null,
      sliderValues: sliceForLayer(sliderValues, i),
      colorValues: sliceForLayer(colorValues, i),
      channelIsOn: sliceForLayer(channelIsOn, i),
      dtype,
      colormap,
      unprojectLensBounds,
      isLensOn,
      lensSelection,
      // Shared props with BitmapLayer:
      bounds,
      id: `tile-sub-layer-${bounds}-${id}-${i}`,
      tileId: { x, y, z },
      onHover,
      pickable,
      onClick,
      modelMatrix,
      opacity,
      visible,
      parameters: i > 0 && {
        blendFunc: [GL.ONE, GL.ONE, GL.ONE, GL.ONE],
        blendEquation: GL.FUNC_ADD
      }
    });
  });
  return layers;
}
