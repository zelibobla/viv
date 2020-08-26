/* eslint-disable import/no-extraneous-dependencies, no-unused-expressions */
import test from 'tape-catch';
import { generateLayerTests, testLayer } from '@deck.gl/test-utils';
import { OrthographicView } from '@deck.gl/core';
import ScaleBarLayer from '../../../src/layers/ScaleBarLayer';

const VIEWPORT_ID = 'ortho';

test('ScaleBarLayer', t => {
  const view = new OrthographicView({
    id: VIEWPORT_ID,
    controller: true,
    height: 4,
    width: 4,
    target: [2, 2, 0],
    zoom: 0
  });
  const testCases = generateLayerTests({
    Layer: ScaleBarLayer,
    assert: t.ok,
    sampleProps: {
      unit: 'cm',
      size: 1,
      position: 'bottom-left',
      viewportId: VIEWPORT_ID
    },
    onBeforeUpdate: ({ testCase }) => t.comment(testCase.title)
  });
  testLayer({
    Layer: ScaleBarLayer,
    testCases,
    onError: t.notOkimport,
    viewport: view.makeViewport({
      height: 4,
      width: 4,
      viewportId: VIEWPORT_ID
    })
  });
  t.end();
});
