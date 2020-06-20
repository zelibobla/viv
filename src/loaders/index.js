import { openArray, HTTPStore } from 'zarr';
import { fromUrl } from 'geotiff';
import Pool from './Pool';
import ZarrLoader from './zarrLoader';
import OMETiffLoader from './OMETiffLoader';
import { getChannelStats, getJson } from './utils';
import OMEZarrReader from './omeZarrReader';

export async function createZarrLoader({
  url,
  dimensions,
  isPyramid,
  isRgb,
  scale,
  translate
}) {
  let data;
  const store = typeof url === 'string' ? new HTTPStore(url) : url;
  if (isPyramid) {
    const { metadata } = await getJson(store, '.zmetadata');
    const paths = Object.keys(metadata)
      .filter(metaKey => metaKey.includes('.zarray'))
      .map(arrMetaKeys => arrMetaKeys.slice(0, -7));
    data = Promise.all(paths.map(path => openArray({ store, path })));
  } else {
    data = openArray({ store });
  }
  return new ZarrLoader({
    data: await data,
    dimensions,
    scale,
    translate,
    isRgb
  });
}

/**
 * This function wraps creating a ome-tiff loader.
 * @param {Object} args
 * @param {String} args.url URL from which to fetch the tiff.
 * @param {Array} args.offsets List of IFD offsets.
 * @param {Object} args.headers Object containing headers to be passed to all fetch requests.
 */
export async function createOMETiffLoader({ url, offsets = [], headers = {} }) {
  const tiff = await fromUrl(url, headers);
  const firstImage = await tiff.getImage(0);
  const pool = new Pool();
  const omexmlString = firstImage.fileDirectory.ImageDescription;
  return new OMETiffLoader({
    tiff,
    pool,
    firstImage,
    omexmlString,
    offsets
  });
}

export { ZarrLoader, OMETiffLoader, OMEZarrReader, getChannelStats };
