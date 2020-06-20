import { openArray, HTTPStore } from 'zarr';
import ZarrLoader from './zarrLoader';
import { getJson } from './utils';

/**
 * This class attempts to be a javascript implementation of ome-zarr-py
 * https://github.com/ome/ome-zarr-py/blob/master/ome_zarr.py
 * @param {Zarr.Store} valid zarr store
 * @param {Object} rootAttrs metadata for zarr store
 * */
class OMEZarrReader {
  constructor(zarrStore, rootAttrs) {
    this.zarrStore = zarrStore;
    this.rootAttrs = rootAttrs;
    if (!('omero' in rootAttrs)) {
      throw Error('Remote zarr is not ome-zarr format.');
    }
    this.imageData = rootAttrs.omero;
  }

  /**
   * Returns OMEZarrReader instance.
   * @param {String|Zarr.Store} store root zarr store
   * @returns {OMEZarrReader} OME reader for zarr store
   */
  static async fromStore(store) {
    if (typeof store === 'string') {
      store = new HTTPStore(store); // eslint-disable-line no-param-reassign
    }
    const rootAttrs = await getJson(store, '.zattrs');
    return new OMEZarrReader(store, rootAttrs);
  }

  /**
   * Returns ZarrLoader as well as omero image metadata object.
   * @returns {Object} { loader: ZarrLoader, metadata: Object }
   */
  async loadOMEZarr() {
    let resolutions = ['0']; // TODO: could be first alphanumeric dataset on err
    if ('multiscales' in this.rootAttrs) {
      const { datasets } = this.rootAttrs.multiscales[0];
      resolutions = datasets.map(d => d.path);
    }
    const promises = resolutions.map(r =>
      openArray({ store: this.zarrStore, path: r })
    );
    const pyramid = await Promise.all(promises);
    const data = pyramid.length > 1 ? pyramid : pyramid[0];
    const dimensions = ['t', 'c', 'z', 'y', 'x'].map(field => ({ field }));
    return {
      loader: new ZarrLoader({ data, dimensions }),
      metadata: this.imageData
    };
  }
}

export default OMEZarrReader;
