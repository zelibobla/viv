import { CompositeLayer, COORDINATE_SYSTEM } from '@deck.gl/core';
import { Matrix4 } from 'math.gl';
import XRLayer from './XRLayer';
import { overrideChannelProps, padWithDefault } from './utils';

const defaultProps = {
  pickable: false,
  coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
  sliderValues: { type: 'array', value: [], compare: true },
  channelIsOn: { type: 'array', value: [], compare: true },
  colorValues: { type: 'array', value: [], compare: true },
  loader: {
    type: 'object',
    value: {
      getRaster: () => [],
      vivMetadata: { imageHeight: 0, imageWidth: 0 }
    },
    compare: true
  }
};

function scaleBounds({ imageWidth, imageHeight }) {
  const left = 951 * 20;
  const top = 601 * 20;
  const right = imageWidth * 20 + left;
  const bottom = imageHeight * 20 + top;
  return [left, bottom, right, top];
}

export default class StaticImageLayer extends CompositeLayer {
  initializeState() {
    const { loader } = this.props;
    this.setState({ data: loader.getRaster({ z: 0, level: 1 }) });
  }

  renderLayers() {
    const { loader, visible } = this.props;
    const { imageWidth, imageHeight } = loader.vivMetadata;
    const { sliderValues, colorValues } = overrideChannelProps(this.props);
    const { data } = this.state;
    const bounds = scaleBounds({ imageWidth, imageHeight });
    return new XRLayer({
      channelData: data,
      bounds,
      sliderValues: padWithDefault(
        [sliderValues[0], sliderValues[1]],
        [2 ** 32, 2 ** 32],
        5
      ).flat(),
      colorValues,
      staticImageHeight: imageHeight,
      staticImageWidth: imageWidth,
      id: `XR-Static-Layer-${0}-${imageHeight}-${imageWidth}-${0}`,
      visible
    });
  }
}

StaticImageLayer.layerName = 'StaticImageLayer';
StaticImageLayer.defaultProps = defaultProps;
