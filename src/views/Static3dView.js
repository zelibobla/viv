// eslint-disable-next-line max-classes-per-file
import { OrbitView } from '@deck.gl/core';
import { Static3DLayer } from '../layers';
import { getVivId } from './utils';
import VivView from './VivView';

export default class Static3dView extends VivView {
  getDeckGlView() {
    const { height, width, id, x, y } = this;
    return new OrbitView({
      id,
      controller: true,
      height,
      width,
      x,
      y
    });
  }

  getLayers({ props }) {
    const { loader } = props;
    const { id } = this;
    const layers = [];

    const detailLayer = new Static3DLayer(props, {
      id: `${loader.type}${getVivId(id)}`,
      viewportId: id
    });
    layers.push(detailLayer);

    return layers;
  }
}
