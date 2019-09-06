import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import ShoppingCartOutlined from '@material-ui/icons/ShoppingCartOutlined';
import AccountCircle from '@material-ui/icons/AccountCircleOutlined';
import { Link, Location } from '@reach/router';
import { routes } from 'general/routes/routes';
import { Hidden, Container, Typography, Button } from '@material-ui/core';
import { ThunkDispatch } from 'redux-thunk';
import { toggleMobileDrawerAction, ToggleMobileDrawerAction } from 'general/redux/ui/uiActions';
import { RootState } from 'general/redux/rootReducer';
import { connect } from 'react-redux';
import { SignedInUser } from 'general/account/SignedInUserModel';
import { SelectedRestStateReducer } from 'general/rest/redux/restReducer';
const logo = '/assets/logo/foodflick800.png';

type props = {
  cartItemCount: number,
  signedInUser?: SignedInUser,
  selectedRest?: SelectedRestStateReducer,
  toggleMobileDrawer: () => void,
}

const useStyles = makeStyles(theme => ({
  account: {
    color: theme.palette.text.primary,
  },
  cart: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    color: theme.palette.text.primary,
  },
  padding: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  container: {
    padding: 0,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  pushLeft: {
    flexGrow: 1,
  },
  spacer: {
    height: theme.mixins.navbar.marginBottom,
  },
  logo: {
    verticalAlign: 'middle',
    width: 100,
    height: '50%',
  },
}));

const Navbar: React.FC<props> = ({ cartItemCount, signedInUser, toggleMobileDrawer, selectedRest }) => {
  const classes = useStyles();
  return (
    <>
      <AppBar position='sticky' color='default'>
        <Container className={classes.container}>
          <Toolbar>
            <Location>
            {({ location }) => (
              <>
                {selectedRest && location.pathname === routes.menuBrowser.getLink(selectedRest.Url) &&
                <Hidden mdUp>
                  <IconButton edge='start' className={classes.menuButton} color='inherit' onClick={() => toggleMobileDrawer()}>
                    <MenuIcon />
                  </IconButton>
                </Hidden>}
              </>
            )}
            </Location>
            <div className={classes.pushLeft}>
              <Link to={routes.home.getLink()}>
                <img src={logo} alt='logo' className={classes.logo}/>
              </Link>
            </div>
            <Link to={routes.cart.getLink()} style={{ textDecoration: 'none' }}>
              <div className={classes.cart}>
                <IconButton color='inherit'>
                  <ShoppingCartOutlined />
                  <Typography variant='subtitle2' className={classes.padding}>{cartItemCount}</Typography>
                </IconButton>
              </div>
            </Link>
            {signedInUser && 
              <Link to={routes.account.getLink()} style={{ textDecoration: 'none' }}>
                <IconButton className={classes.account}>
                  <AccountCircle />
                </IconButton>
              </Link>
            }
            {!signedInUser &&
              <Link to={routes.signIn.getLink()} style={{ textDecoration: 'none' }}>
                <Button>
                  Sign in
                </Button>
              </Link>
            }
            
          </Toolbar>
        </Container>
      </AppBar>
      {/* empty child to satisfying children prop warning */}
      <Container className={classes.spacer}><></></Container>
    </>
  );
}

const mapStateToProps = (state: RootState) => ({
  selectedRest: state.OrderingFlow.selectedRest,
  cartItemCount: state.OrderingFlow.cart ? state.OrderingFlow.cart.Items.length : 0,
  signedInUser: state.Account.SignedInUser,
});

const mapDispatchToProps = (dispatch: ThunkDispatch<RootState, null, ToggleMobileDrawerAction>) => ({
  toggleMobileDrawer: () => dispatch(toggleMobileDrawerAction())
})

export default connect(mapStateToProps, mapDispatchToProps)(Navbar);