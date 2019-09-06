import React from 'react';
import {  makeStyles, Theme } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    display: 'flex',
  },
  wrapper: {
    position: 'relative',
  },
  buttonProgress: {
    color: theme.palette.common.loading,
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
}));

type props = {
  isLoading: boolean,
}

const WithLoader: React.FC<props> =({ isLoading, children }) => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <div className={classes.wrapper}>
        {children}
        {isLoading && <CircularProgress size={24} className={classes.buttonProgress} />}
      </div>
    </div>
  );
}

export default WithLoader;