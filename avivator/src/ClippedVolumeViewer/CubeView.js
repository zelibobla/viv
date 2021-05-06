import { VolumeView } from '@hms-dbmi/viv';
import CubeLayer from './CubeLayer/CubeLayer';
/**
 * This class generates a VolumeLayer and a view for use in the VivViewer as volumetric rendering.
 * @param {Object} args
 * @param {Array<number>} args.target Centered target for the camera (used if useFixedAxis is true)
 * @param {Boolean} args.useFixedAxis Whether or not to fix the axis of the camera.
 * */
export default class CubeView extends VolumeView {
  getLayers({ props }) {
    const layers = [new CubeLayer({ id: `cube-layer-#${this.id}#` })];
    return layers;
  }
}
