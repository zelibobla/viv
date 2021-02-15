import { BoundsCheckError } from 'zarr';
import { isInterleaved, getImageSize } from '../utils';
import { getIndexer } from './lib/indexer';
import type { ZarrArray, TypedArray } from 'zarr';
import type { RawArray } from 'zarr/types/rawArray';

import type {
  PixelSource,
  Labels,
  RasterSelection,
  PixelSourceSelection,
  PixelData,
  TileSelection,
  SupportedTypedArray
} from '../../types';

const DTYPE_LOOKUP = {
  u1: 'Uint8',
  u2: 'Uint16',
  u4: 'Uint32',
  f4: 'Float32',
  i1: 'Int8',
  i2: 'Int16',
  i4: 'Int32'
} as const;

type ZarrIndexer<S extends string[]> = (
  sel: { [K in S[number]]: number } | number[]
) => number[];

interface ZarrTileSelection {
  x: number;
  y: number;
  selection: number[];
  signal?: AbortSignal;
}

class ZarrPixelSource<S extends string[]> implements PixelSource<S> {
  private _data: ZarrArray;
  private _indexer: ZarrIndexer<S>;

  constructor(data: ZarrArray, public labels: Labels<S>) {
    this._indexer = getIndexer(labels);
    this._data = data;
  }

  get tileSize() {
    return this._data.chunks[this._xIndex];
  }

  get shape() {
    return this._data.shape;
  }

  get dtype() {
    const suffix = this._data.dtype.slice(1) as keyof typeof DTYPE_LOOKUP;
    if (!(suffix in DTYPE_LOOKUP)) {
      throw Error(`Zarr dtype not supported, got ${suffix}.`);
    }
    return DTYPE_LOOKUP[suffix];
  }

  private get _xIndex() {
    const interleave = isInterleaved(this._data.shape);
    return this._data.shape.length - (interleave ? 2 : 1);
  }

  private _chunkIndex<T>(
    selection: PixelSourceSelection<S> | number[],
    x: T,
    y: T
  ) {
    const sel: (number | T)[] = this._indexer(selection);
    sel[this._xIndex] = x;
    sel[this._xIndex - 1] = y;
    return sel;
  }

  async getRaster({ selection }: RasterSelection<S> | { selection: number[] }) {
    const sel = this._chunkIndex(selection, null, null);
    const { data, shape } = (await this._data.getRaw(sel)) as RawArray;
    const [height, width] = shape;
    return { data, width, height } as PixelData;
  }

  async getTile(props: TileSelection<S> | ZarrTileSelection) {
    const { x, y, selection, signal } = props;
    const sel = this._chunkIndex(selection, x, y);

    const { data, shape } = (await this._data.getRawChunk(sel, {
      storeOptions: { signal }
    })) as RawArray;

    const [height, width] = shape;
    return { data, width, height } as PixelData;
  }

  async getVolume(
    {
      selection
    }:
      | RasterSelection<S>
      | TileSelection<S>
      | ZarrTileSelection
      | { selection: number[] },
    // eslint-disable-next-line no-unused-vars
    updateProgress = () => {},
    downsampleDepth = 1
  ) {
    const { shape, labels, dtype } = this;
    const { height, width } = getImageSize(this as PixelSource<S>);
    const depth = shape[labels.indexOf('z')];
    const depthDownsampled = Math.floor(depth / downsampleDepth);
    const rasterSize = height * width;
    const name = `${dtype}Array`;
    const ArrayType = window[name] as SupportedTypedArray;
    const { BYTES_PER_ELEMENT } = ArrayType;
    const setMethodString = `set${dtype}` as
      | 'setUint8'
      | 'setUint16'
      | 'setUint32'
      | 'setFloat32';
    const view = new DataView(
      new ArrayBuffer(rasterSize * depthDownsampled * BYTES_PER_ELEMENT)
    );
    await Promise.all(
      new Array(depthDownsampled).fill(0).map(async (_, z) => {
        const depthSelection = {
          ...selection,
          z: z * downsampleDepth
        };
        const sel = this._chunkIndex(depthSelection, null, null);
        const { data } = (await this._data.getRaw(sel)) as RawArray;
        let r = 0;
        updateProgress();
        while (r < rasterSize) {
          view[setMethodString](
            BYTES_PER_ELEMENT * (depthDownsampled - z - 1) * rasterSize +
              BYTES_PER_ELEMENT * r,
            data[r],
            true
          );
          r += 1;
        }
        updateProgress();
      })
    );
    return {
      data: new globalThis[name](view.buffer) as SupportedTypedArray,
      height,
      width,
      depth: depthDownsampled
    } as PixelData;
  }

  onTileError(err: Error) {
    if (!(err instanceof BoundsCheckError)) {
      // Rethrow error if something other than tile being requested is out of bounds.
      throw err;
    }
  }
}

export default ZarrPixelSource;
