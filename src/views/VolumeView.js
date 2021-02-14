// eslint-disable-next-line max-classes-per-file
import { OrbitView } from '@deck.gl/core';
import { VolumeLayer } from '../layers';
import { getVivId } from './utils';
import VivView from './VivView';

/**
 * This class generates a VolumeLayer and a view for use in the VivViewer as volumetric rendering.
 * */
export default class VolumeView extends VivView {
  constructor({ target, ...args }) {
    super(args);
    this.target = target;
  }

  getDeckGlView() {
    const { height, width, id, x, y } = this;
    return new OrbitView({
      id,
      controller: true,
      height,
      width,
      x,
      y,
      orbitAxis: 'Y'
    });
  }

  filterViewState({ viewState }) {
    // Scale the view as the overviewScale changes with screen resizing - basically, do not react to any view state changes.
    const { id, target } = this;
    return viewState.id === id
      ? {
          ...viewState,
          target
        }
      : null;
  }

  getLayers({ props }) {
    const { loader } = props;
    const { id } = this;
    const layers = [];

    const detailLayer = new VolumeLayer(props, {
      id: `${loader.type}${getVivId(id)}`,
      viewportId: id
    });
    layers.push(detailLayer);

    return layers;
  }
}
