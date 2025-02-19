import React from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';

import {
  LoaderError,
  OffsetsWarning,
  NoImageUrlInfo,
  VolumeRenderingWarning
} from './SnackbarAlerts';
import { useViewerStore } from '../../state';

const SnackBars = () => {
  const {
    isOffsetsSnackbarOn,
    loaderErrorSnackbar,
    isNoImageUrlSnackbarOn,
    toggleIsOffsetsSnackbarOn,
    toggleIsNoImageUrlSnackbarOn,
    isVolumeRenderingWarningOn,
    toggleIsVolumeRenderingWarningOn,
    setViewerState
  } = useViewerStore();
  return (
    <>
      <Snackbar
        open={isOffsetsSnackbarOn}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        elevation={6}
        variant="filled"
      >
        <Alert onClose={toggleIsOffsetsSnackbarOn} severity="warning">
          <OffsetsWarning />
        </Alert>
      </Snackbar>
      <Snackbar
        open={loaderErrorSnackbar.on}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        elevation={6}
        variant="filled"
      >
        <Alert
          onClose={() =>
            setViewerState({
              loaderErrorSnackbar: { on: false, message: null }
            })
          } // eslint-disable-line react/jsx-curly-newline
          severity="error"
        >
          <LoaderError message={loaderErrorSnackbar.message} />
        </Alert>
      </Snackbar>

      <Snackbar
        open={isNoImageUrlSnackbarOn}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        elevation={6}
        variant="filled"
      >
        <Alert onClose={toggleIsNoImageUrlSnackbarOn} severity="info">
          <NoImageUrlInfo />
        </Alert>
      </Snackbar>
      <Snackbar
        open={isVolumeRenderingWarningOn}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        elevation={6}
        variant="filled"
      >
        <Alert onClose={toggleIsVolumeRenderingWarningOn} severity="warning">
          <VolumeRenderingWarning />
        </Alert>
      </Snackbar>
    </>
  );
};
export default SnackBars;
