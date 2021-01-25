import GL from '@luma.gl/constants';

export const MAX_COLOR_INTENSITY = 255;

export const DEFAULT_COLOR_OFF = [0, 0, 0];

export const MAX_SLIDERS_AND_CHANNELS = 6;

export const DEFAULT_FONT_FAMILY =
  "-apple-system, 'Helvetica Neue', Arial, sans-serif";

export const DTYPE_VALUES = {
  Uint8: {
    format: GL.R8UI,
    dataFormat: GL.RED_INTEGER,
    type: GL.UNSIGNED_BYTE,
    max: 2 ** 8 - 1,
    TypedArray: Uint8Array,
    setMethodString: 'setUint8'
  },
  Uint16: {
    format: GL.R16UI,
    dataFormat: GL.RED_INTEGER,
    type: GL.UNSIGNED_SHORT,
    max: 2 ** 16 - 1,
    TypedArray: Uint16Array,
    setMethodString: 'setUint16'
  },
  Uint32: {
    format: GL.R32UI,
    dataFormat: GL.RED_INTEGER,
    type: GL.UNSIGNED_INT,
    max: 2 ** 32 - 1,
    TypedArray: Uint32Array,
    setMethodString: 'setUint32'
  },
  Float32: {
    format: GL.R32F,
    dataFormat: GL.RED,
    type: GL.FLOAT,
    TypedArray: Float32Array,
    setMethodString: 'setFloat32',
    // Not sure what to do about this one - a good use case for channel stats, I suppose:
    // https://en.wikipedia.org/wiki/Single-precision_floating-point_format.
    max: 3.4 * 10 ** 38
  }
} as const;

export const COLORMAPS = [
  'jet',
  'hsv',
  'hot',
  'cool',
  'spring',
  'summer',
  'autumn',
  'winter',
  'bone',
  'copper',
  'greys',
  'yignbu',
  'greens',
  'yiorrd',
  'bluered',
  'rdbu',
  'picnic',
  'rainbow',
  'portland',
  'blackbody',
  'earth',
  'electric',
  'alpha',
  'viridis',
  'inferno',
  'magma',
  'plasma',
  'warm',
  'rainbow-soft',
  'bathymetry',
  'cdom',
  'chlorophyll',
  'density',
  'freesurface-blue',
  'freesurface-red',
  'oxygen',
  'par',
  'phase',
  'salinity',
  'temperature',
  'turbidity',
  'velocity-blue',
  'velocity-green',
  'cubehelix'
];

export const RENDERING_MODES = {
  MAX_INTENSITY_PROJECTION: 'Maximum Intensity Projection',
  MIN_INTENSITY_PROJECTION: 'Minimum Intensity Projection',
  ADDITIVE: 'Additive'
};
export const GLOBAL_SLIDER_DIMENSION_FIELDS = ['z', 't'];
