import React from 'react';
import { Theme, Hidden, Drawer } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import CategoryNameListNavigator from './CategoryNameListNavigator';

const useStyles = makeStyles((theme: Theme) => ({
  paper: {
    zIndex: theme.zIndex.appBar - 1,
    width: theme.mixins.drawer.width,
    top: 'initial',
    left: 'initial',
    paddingTop: theme.mixins.navbar.marginBottom,
    marginTop: -theme.mixins.navbar.marginBottom,
  },
  drawer: {
    width: theme.mixins.drawer.width,
  },
  listItem: {
    cursor: 'pointer',
  }
}));

const DesktopDrawer: React.FC = () => {
  const classes = useStyles();
  return (
    <Hidden smDown>
      <Drawer
        className={classes.drawer}
        classes={{
          paper: classes.paper,
        }}
        variant='permanent'
      >
        <CategoryNameListNavigator />
      </Drawer>
    </Hidden>
  )
}

export default DesktopDrawer;