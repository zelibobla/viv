import { range } from '../../src/layers/VivViewerLayer/utils';

const channelNames = [
  'DAPI - Hoechst (nuclei)',
  'FITC - Laminin (basement membrane)',
  'Cy3 - Synaptopodin (glomerular)',
  'Cy5 - THP (thick limb)'
];

const basePyramidInfo = {
  dimensions: [
    { field: 'channel', type: 'nominal', values: channelNames },
    { field: 'y', type: 'quantitative', values: null },
    { field: 'x', type: 'quantitative', values: null }
  ],
  isPublic: true,
  isPyramid: true,
  selections: channelNames.map(name => ({ channel: name }))
};

const tiffInfo = {
  url: `https://vitessce-demo-data.storage.googleapis.com/test-data/deflate_no_legacy/spraggins.bioformats.raw2ometiff.ome.tif`,
  ...basePyramidInfo,
  description: 'Kidney mxIF (OME-TIFF)'
};

const zarrInfo = {
  url: `https://vitessce-data.storage.googleapis.com/0.0.25/master_release/spraggins/spraggins.mxif.zarr`,
  ...basePyramidInfo,
  description: 'Kidney mxIF (zarr)'
};

const staticInfo = {
  url: `https://vitessce-data.storage.googleapis.com/0.0.25/master_release/spraggins/spraggins.ims.zarr`,
  isPublic: false,
  initialViewState: {
    zoom: -1,
    target: [1000, 500]
  },
  dimensions: [
    {
      field: 'mz',
      type: 'ordinal',
      values: [
        '675.5366',
        '703.5722',
        '721.4766',
        '725.5562',
        '729.5892',
        '731.606',
        '734.5692',
        '737.4524',
        '739.4651',
        '741.5302',
        '745.4766',
        '747.4938',
        '749.5093',
        '753.5892',
        '756.5534',
        '758.5706',
        '772.5225',
        '772.5506',
        '776.5928',
        '780.5528',
        '782.5697',
        '784.5841',
        '786.6012',
        '787.6707',
        '790.5157',
        '796.5259',
        '798.54',
        '804.5528',
        '806.5683',
        '808.5838',
        '809.6518',
        '810.6',
        '811.6699',
        '813.6847',
        '815.699',
        '820.5262',
        '822.5394',
        '824.5559',
        '825.6241',
        '828.5495',
        '830.5666',
        '832.5816',
        '833.649',
        '835.6666',
        '837.6798',
        '848.5577',
        '851.6374'
      ]
    },
    { field: 'y', type: 'quantitative', values: null },
    { field: 'x', type: 'quantitative', values: null }
  ],
  selections: [{ mz: '703.5722' }, { mz: '721.4766' }],
  description: 'Kidney IMS (zarr)'
};

const rootStaticTiffUrl =
  'https://vitessce-demo-data.storage.googleapis.com/test-data/antigen_exprs.ome.tiff';

const staticTiffInfo = {
  url: rootStaticTiffUrl,
  dimensions: [
    {
      field: 'channel',
      type: 'nominal',
      values: [
        'Actin',
        'CD107a',
        'CD11c',
        'CD20',
        'CD21',
        'CD31',
        'CD3e',
        'CD4',
        'CD45',
        'CD45RO',
        'CD68',
        'CD8',
        'DAPI_2',
        'E_CAD',
        'Histone_H3',
        'Ki67',
        'Pan_CK',
        'Podoplanin'
      ]
    },
    { field: 'y', type: 'quantitative', values: null },
    { field: 'x', type: 'quantitative', values: null },
    { field: 'time', type: 'number', values: null },
    { field: 'z', type: 'number', values: null }
  ],
  initialViewState: {
    zoom: -1,
    target: [1000, 500]
  },
  isPublic: false,
  isPyramid: false,
  selections: ['DAPI_2', 'E_CAD', 'Histone_H3', 'Ki67'].map(channel => {
    return { channel, time: 0, z: 0 };
  }),
  description: 'CODEX Tile'
};

const remoteBFTiffUrl =
  'https://vitessce-demo-data.storage.googleapis.com/test-data/TONSIL-1_40X.ome.tif';

const remoteBFTiff = {
  url: remoteBFTiffUrl,
  initialViewState: {
    zoom: -3,
    target: [5000, 5000]
  },
  dimensions: [
    {
      field: 'channel',
      type: 'nominal',
      values: range(47).map(i => `Channel ${i}`)
    },
    { field: 'y', type: 'quantitative', values: null },
    { field: 'x', type: 'quantitative', values: null },
    { field: 'time', type: 'number', values: null },
    { field: 'z', type: 'number', values: null }
  ],
  isPublic: false,
  isPyramid: true,
  selections: range(4)
    .map(i => `Channel ${i}`)
    .map(channel => {
      return { channel, time: 0, z: 0 };
    }),
  description: 'Tonsil Legacy Bioformats Pyramid Tiff'
};

const remoteTiffUrl2 =
  'https://vitessce-demo-data.storage.googleapis.com/test-data/VAN0003-LK-32-21-AF_preIMS_registered.pyramid.ome.tiff ';

const remoteTiff2 = {
  url: remoteTiffUrl2,
  initialViewState: {
    zoom: -5,
    target: [30000, 30000]
  },
  dimensions: [
    {
      field: 'channel',
      type: 'nominal',
      values: [
        'DAPI - autofluorescence',
        'eGFP - autofluorescence',
        'dsRed - autofluorescence'
      ]
    },
    { field: 'y', type: 'quantitative', values: null },
    { field: 'x', type: 'quantitative', values: null },
    { field: 'time', type: 'number', values: null },
    { field: 'z', type: 'number', values: null }
  ],
  isPublic: false,
  isPyramid: true,
  selections: [
    'DAPI - autofluorescence',
    'eGFP - autofluorescence',
    'dsRed - autofluorescence'
  ].map(channel => {
    return { channel, time: 0, z: 0 };
  }),
  description: 'VAN0003-LK-32-21 Donor Image'
};
// Originally from http://cellimagelibrary.org/images/13384
const rootStatic3DUrl =
  'https://vitessce-demo-data.storage.googleapis.com/test-data/3d_zStack.zarr/3d_zStack.zarr/';

const rootStatic3DInfo = {
  url: rootStatic3DUrl,
  dimensions: [
    {
      field: 'channel',
      type: 'nominal',
      values: [
        'PTEN gene loci Channel Selection',
        'VEGF loci Channel Selection',
        'Nuclei? Channel Selection'
      ]
    },
    { field: 'z', type: 'quantitative', values: null },
    { field: 'y', type: 'quantitative', values: null },
    { field: 'x', type: 'quantitative', values: null }
  ],
  initialViewState: {
    zoom: -1,
    target: [512, 512, 26]
  },
  isPublic: false,
  isPyramid: false,
  is3d: true,
  selections: [
    'Nuclei? Channel Selection',

    'PTEN gene loci Channel Selection',
    'VEGF loci Channel Selection'
  ].map(channel => {
    return { channel };
  }),
  description: '3D Confocal FISH Stack (Cell Image Library)'
};

// Originally from http://cellimagelibrary.org/images/12247
const rootStatic3DUrl2 =
  'https://vitessce-demo-data.storage.googleapis.com/test-data/CIL_data/12247.zarr';

const rootStatic3DInfo2 = {
  url: rootStatic3DUrl2,
  dimensions: [
    {
      field: 'channel',
      type: 'nominal',
      values: ['FITC', 'TexasRed', 'DAPI']
    },
    { field: 'z', type: 'quantitative', values: null },
    { field: 'y', type: 'quantitative', values: null },
    { field: 'x', type: 'quantitative', values: null }
  ],
  initialViewState: {
    zoom: -1,
    target: [256, 256, 21]
  },
  isPublic: false,
  isPyramid: false,
  is3d: true,
  selections: ['DAPI', 'TexasRed', 'FITC'].map(channel => {
    return { channel };
  }),
  description: '3D Confocal IF Stack Gallus Mitosis (Cell Image Library)'
};

const rootFlorida3DUrl =
  'https://vitessce-demo-data.storage.googleapis.com/test-data/florida_3d/florida_downsample/561.czi.florida.zarr';

const rootFlorida3DInfo = {
  url: rootFlorida3DUrl,
  dimensions: [
    {
      field: 'channel',
      type: 'nominal',
      values: ['561']
    },
    { field: 'z', type: 'quantitative', values: null },
    { field: 'y', type: 'quantitative', values: null },
    { field: 'x', type: 'quantitative', values: null }
  ],
  initialViewState: {
    zoom: -0.5,
    target: [240, 240, 55.5]
  },
  isPublic: false,
  isPyramid: false,
  is3d: true,
  selections: ['561'].map(channel => {
    return { channel };
  }),
  description: '3D LSFM Stack (UFlorida HuBMAP)'
};

const rootSeqFISH3DUrl =
  'https://vitessce-demo-data.storage.googleapis.com/test-data/seqfish_3d/3d_seqfish_zStack.zarr/';

const rootSeqFISH3DInfo = {
  url: rootSeqFISH3DUrl,
  dimensions: [
    {
      field: 'channel',
      type: 'nominal',
      values: ['635', '561', '488', '405']
    },
    { field: 'z', type: 'quantitative', values: null },
    { field: 'y', type: 'quantitative', values: null },
    { field: 'x', type: 'quantitative', values: null }
  ],
  initialViewState: {
    zoom: -2,
    target: [1024, 1024, 10]
  },
  isPublic: false,
  isPyramid: false,
  is3d: true,
  selections: ['635', '561', '488', '405'].map(channel => {
    return { channel };
  }),
  description: '3D Sliced seqFish Stack (CalTech HuBMAP)'
};

const root3DCodexUrl =
  'https://vitessce-demo-data.storage.googleapis.com/test-data/codex_3d/3d_codex_zStack.zarr/';

const codex3DInfo = {
  url: root3DCodexUrl,
  dimensions: [
    {
      field: 'channel',
      type: 'nominal',
      values: [
        'Actin',
        'CD107a',
        'CD11c',
        'CD20',
        'CD21',
        'CD31',
        'CD3e',
        'CD4',
        'CD45',
        'CD45RO',
        'CD68',
        'CD8',
        'DAPI_2',
        'E_CAD',
        'Histone_H3',
        'Ki67',
        'Pan_CK',
        'Podoplanin'
      ]
    },
    { field: 'y', type: 'quantitative', values: null },
    { field: 'x', type: 'quantitative', values: null },
    { field: 'z', type: 'number', values: null }
  ],
  initialViewState: {
    zoom: -2,
    target: [1344 / 2, 1007 / 2, 12 / 2]
  },
  isPublic: false,
  isPyramid: false,
  is3d: true,
  selections: ['DAPI_2', 'E_CAD', 'CD107a'].map(channel => {
    return { channel };
  }),
  description: '3D Confocal CODEX Stack (Stanford HuBMAP)'
};

export default {
  zarr: zarrInfo,
  tiff: tiffInfo,
  static: staticInfo,
  'static tiff': staticTiffInfo,
  'bf tiff': remoteBFTiff,
  'tiff 2': remoteTiff2,
  seqFish: rootSeqFISH3DInfo,
  '3d codex': codex3DInfo,
  '3d florida zarr': rootFlorida3DInfo,
  '3d zarr': rootStatic3DInfo,
  '3d zarr2': rootStatic3DInfo2
};
