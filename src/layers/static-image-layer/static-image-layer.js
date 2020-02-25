import { CompositeLayer } from '@deck.gl/core';
import { COORDINATE_SYSTEM } from 'deck.gl';
import { XRLayer } from '../xr-layer';
import {
  getStaticZarrImage,
  padWithDefault,
  setOrderedValues,
  DEFAULT_COLOR_OFF,
  DEFAULT_SLIDER_OFF,
  MAX_SLIDERS_AND_CHANNELS
} from '../utils';

export class StaticImageLayer extends CompositeLayer {
  initializeState() {
    this.state = {
      data: [],
      imageWidth: 0,
      imageHeight: 0,
      sliderValues: [],
      colorValues: []
    };
  }

  updateState() {
    this.state.data.length == 0 &&
      getStaticZarrImage({ ...this.props }).then(imageInfo => {
        const { data, imageWidth, imageHeight } = imageInfo;
        this.setState({ data, imageWidth, imageHeight });
      });
  }

  renderLayers() {
    const { data, imageWidth, imageHeight } = this.state;
    const { sliderValues, colorValues, channelsOn } = this.props;
    const orderedChannelNames = Object.keys(sliderValues).sort();
    const { orderedSliderValues, orderedColorValues } = setOrderedValues(
      orderedChannelNames,
      colorValues,
      sliderValues,
      channelsOn
    );
    // Need to pad sliders and colors with default values (required by shader)
    const padSize = MAX_SLIDERS_AND_CHANNELS - orderedChannelNames.length;
    if (padSize < 0) {
      throw Error('Too many channels specified for shader.');
    }
    const paddedSliderValues = padWithDefault(
      orderedSliderValues,
      DEFAULT_SLIDER_OFF,
      padSize
    );
    const paddedColorValues = padWithDefault(
      orderedColorValues,
      DEFAULT_COLOR_OFF,
      padSize
    );
    const layers =
      data.length > 0
        ? new XRLayer({
            data,
            bounds: [0, imageHeight, imageWidth, 0],
            sliderValues: paddedSliderValues.flat(),
            colorValues: paddedColorValues,
            staticHeight: imageHeight,
            staticWidth: imageWidth,
            id: `XR-Static-Layer-${0}-${imageHeight}-${imageWidth}-${0}`,
            pickable: false,
            coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
            visible: true
          })
        : [];
    return layers;
  }
}

StaticImageLayer.layerName = 'StaticImageLayer';
