import React from 'react';
import Grid from '@material-ui/core/Grid';

import Slider from '@material-ui/core/Slider';

const Slicer = props => {
  const { xSlice, ySlice, zSlice, setXSlice, setYSlice, setZSlice } = props;
  return (
    <>
      <Grid container direction="row" justify="flex-start" alignItems="center">
        <Grid item xs={1} style={{ marginBottom: 8 }}>
          x:
        </Grid>
        <Grid item xs={11}>
          <Slider
            value={xSlice}
            onChange={v => setXSlice(v)}
            valueLabelDisplay="auto"
            getAriaLabel={() => `x slider`}
            min={0}
            max={1}
            step={0.005}
            orientation="horizontal"
          />
        </Grid>
      </Grid>
      <Grid container direction="row" justify="flex-start" alignItems="center">
        <Grid item xs={1} style={{ marginBottom: 8 }}>
          y:
        </Grid>
        <Grid item xs={11}>
          <Slider
            value={ySlice}
            onChange={v => setYSlice(v)}
            valueLabelDisplay="auto"
            getAriaLabel={() => `y slider`}
            min={0}
            max={1}
            step={0.005}
            orientation="horizontal"
          />
        </Grid>
      </Grid>
      <Grid container direction="row" justify="flex-start" alignItems="center">
        <Grid item xs={1} style={{ marginBottom: 8 }}>
          z:
        </Grid>
        <Grid item xs={11}>
          <Slider
            value={zSlice}
            onChange={v => setZSlice(v)}
            valueLabelDisplay="auto"
            getAriaLabel={() => `z slider`}
            min={0}
            max={1}
            step={0.005}
            orientation="horizontal"
          />
        </Grid>
      </Grid>
    </>
  );
};

export default Slicer;
