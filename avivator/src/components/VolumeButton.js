import React, { useState, useEffect, useRef, useReducer } from 'react';

import Button from '@material-ui/core/Button';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
  paper: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)'
  },
  span: {
    width: '70px',
    textAlign: 'center',
    paddingLeft: '2px',
    paddingRight: '2px'
  },
  colors: {
    '&:hover': {
      backgroundColor: 'transparent'
    },
    paddingLeft: '2px',
    paddingRight: '2px'
  }
}));

function VolumeButton({
  toggleUse3d,
  loader,
  isLoading,
  use3d,
  on3DResolutionSelect
}) {
  const [open, toggle] = useReducer(v => !v, false);
  const anchorRef = useRef(null);
  const classes = useStyles();
  return (
    <>
      <Button
        disabled={loader.omexml?.SizeZ === 1 || isLoading}
        variant="outlined"
        size="small"
        ref={anchorRef}
        onClick={() => {
          toggle();
          // eslint-disable-next-line no-unused-expressions
          use3d && toggleUse3d();
        }}
        fullWidth
      >
        {use3d ? 'Hide' : 'Show'} Volumetric Rendering
      </Button>
      <Popper open={open} anchorEl={anchorRef.current} placement="bottom-end">
        <Paper className={classes.paper}>
          <ClickAwayListener onClickAway={toggle}>
            <MenuList id="resolution-options">
              {Array.from({ length: loader.numLevels + 1 })
                .fill(0)
                .map((v, z) => {
                  const { height, width, depth } = loader.getRasterSize({ z });
                  return (
                    <MenuItem
                      dense
                      disableGutters
                      onClick={() => {
                        on3DResolutionSelect(z);
                        toggleUse3d();
                        toggle();
                      }}
                      key={`(${height}, ${width}, ${depth})`}
                    >
                      {`${z}x Downsampled (${height}, ${width}, ${depth})`}
                    </MenuItem>
                  );
                })}
            </MenuList>
          </ClickAwayListener>
        </Paper>
      </Popper>
    </>
  );
}

export default VolumeButton;
