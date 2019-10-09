import React from 'react';
import { Theme, Hidden, Drawer } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import CategoryNameListNavigator from './CategoryNameListNavigator';
const useStyles = makeStyles((theme: Theme) => ({
  paper: {
    width: theme.mixins.drawer.width,
  },
  listItem: {
    cursor: 'pointer',
  }
}));
type props = {
  isMobileDrawerOpen: boolean,
  toggleMobileDrawer: () => void,
}
const MobileDrawer: React.FC<props> = ({ isMobileDrawerOpen, toggleMobileDrawer }) => {
  const classes = useStyles();
  return (
    <Hidden mdUp>
      <Drawer
        variant='temporary'
        anchor='left'
        onClose={() => toggleMobileDrawer()}
        open={isMobileDrawerOpen}
        classes={{
          paper: classes.paper,
        }}
        ModalProps={{ keepMounted: true }}  // Better open performance on mobile.
      >
        <CategoryNameListNavigator onClickCategory={() => toggleMobileDrawer()}/>
      </Drawer>
    </Hidden>
  );
}

export default MobileDrawer;
