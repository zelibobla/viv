import { BoundsCheckError, slice } from 'zarr';
import { getImageSize, isInterleaved } from '../utils';
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
  f8: 'Float64',
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
  private _readChunks: boolean;

  constructor(
    data: ZarrArray,
    public labels: Labels<S>,
    public tileSize: number
  ) {
    this._indexer = getIndexer(labels);
    this._data = data;

    const xChunkSize = data.chunks[this._xIndex];
    const yChunkSize = data.chunks[this._xIndex - 1];
    this._readChunks = tileSize === xChunkSize && tileSize === yChunkSize;
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

  /**
   * Converts x, y tile indices to zarr dimension Slices within image bounds.
   */
  private _getSlices(x: number, y: number) {
    const { height, width } = getImageSize(this);
    const [xStart, xStop] = [
      x * this.tileSize,
      Math.min((x + 1) * this.tileSize, width)
    ];
    const [yStart, yStop] = [
      y * this.tileSize,
      Math.min((y + 1) * this.tileSize, height)
    ];
    // Deck.gl can sometimes request edge tiles that don't exist. We throw
    // a BoundsCheckError which is picked up in `ZarrPixelSource.onTileError`
    // and ignored by deck.gl.
    if (xStart === xStop || yStart === yStop) {
      throw new BoundsCheckError('Tile slice is zero-sized.');
    }
    return [slice(xStart, xStop), slice(yStart, yStop)];
  }

  async getRaster({ selection }: RasterSelection<S> | { selection: number[] }) {
    const sel = this._chunkIndex(selection, null, null);
    const { data, shape } = (await this._data.getRaw(sel)) as RawArray;
    const [height, width] = shape;
    return { data, width, height } as PixelData;
  }

  async getTile(props: TileSelection<S> | ZarrTileSelection) {
    const { x, y, selection, signal } = props;

    let res;
    if (this._readChunks) {
      // Can read chunks directly by key since tile size matches chunk shape
      const sel = this._chunkIndex(selection, x, y);
      res = await this._data.getRawChunk(sel, { storeOptions: { signal } });
    } else {
      // Need to use zarr fancy indexing to get desired tile size.
      const [xSlice, ySlice] = this._getSlices(x, y);
      const sel = this._chunkIndex(selection, xSlice, ySlice);
      res = await this._data.getRaw(sel);
    }

    const {
      data,
      shape: [height, width]
    } = res as RawArray;
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
            BYTES_PER_ELEMENT * z * rasterSize +
              BYTES_PER_ELEMENT * (rasterSize - r - 1),
            data[((width - r - 1) % width) + width * Math.floor(r / width)],
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
