import React from 'react';

import Slider from '@material-ui/core/Slider';

const Slicer = props => {
  const { xSlice, ySlice, zSlice, setXSlice, setYSlice, setZSlice } = props;
  return (
    <>
      <div key="x">
        {'x: '}
        <Slider
          value={xSlice}
          onChange={(e, v) => {
            setXSlice(v);
          }}
          valueLabelDisplay="auto"
          getAriaLabel={() => `x slider`}
          min={0}
          max={1}
          step={0.005}
          orientation="horizontal"
        />
      </div>
      <div key="y">
        {'y: '}
        <Slider
          value={ySlice}
          onChange={(e, v) => {
            setYSlice(v);
          }}
          valueLabelDisplay="auto"
          getAriaLabel={() => `y slider`}
          min={0}
          max={1}
          step={0.005}
          orientation="horizontal"
        />
      </div>
      <div key="z">
        {'z: '}
        <Slider
          value={zSlice}
          onChange={(e, v) => {
            setZSlice(v);
          }}
          valueLabelDisplay="auto"
          getAriaLabel={() => `z slider`}
          min={0}
          max={1}
          step={0.005}
          orientation="horizontal"
        />
      </div>
    </>
  );
};

export default Slicer;
