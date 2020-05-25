// eslint-disable-next-line max-classes-per-file
import { OrbitView } from '@deck.gl/core';
import { Static3DLayer } from '../layers';
import { getVivId } from './utils';
import VivView from './VivView';

/**
 * This class generates a Static3DLayer and a view for use in the VivViewer as volumetric rendering.
 * */
export default class Static3DView extends VivView {
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
