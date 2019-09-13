import React, { useState, useEffect } from 'react';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { RootState, RootActions } from 'general/redux/rootReducer';
import { connect } from 'react-redux';
import { CartStateReducer } from 'general/order/redux/cartReducer';
import { Typography, Container, Button, useMediaQuery } from '@material-ui/core';
import { useTheme } from '@material-ui/styles';
import { ThunkDispatch } from 'redux-thunk';
import { removeCartItemAction } from 'general/order/redux/cartActions';
import UpdateCartItemModal from 'general/components/useCases/cartItemModal/UpdateCartItemModal';
import { getCustomerItemFromCartItem } from 'general/order/CartItemModel';
import { SignedInUser } from 'general/account/SignedInUserModel';
import SignInModal from './SignInModal';
import { RouteComponentProps } from '@reach/router';
import { routes } from 'general/routes/routes';
import CartItemList from './CartItemList';
import { useGetCartFromOrderId } from 'general/order/orderService';

const useStyles = makeStyles((theme: Theme) => ({
  review: {
    margin: theme.spacing(2, 0),
  },
  emptyCart: {
    width: '100%',
    textAlign: 'center',
    paddingTop: '20%',
  },
  notFound: {
    textAlign: 'center',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
}));

type routeParams = {
  orderId: string,
}
type props = {
  cart: CartStateReducer,
  signedInUser?: SignedInUser,
  removeCartItem: (cartIndex: number) => void,
};

const CartPage: React.FC<props & RouteComponentProps<routeParams>> = ({ cart, removeCartItem, signedInUser, navigate, orderId }) => {
  const classes = useStyles();
  const theme: Theme = useTheme();
  const [getCartFromOrderId, { loading, error, called, data }] = useGetCartFromOrderId()
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [needsSignInModal, setNeedsSignInModal] = useState(false);
  const [selectedCartIndex, setSelectedCartIndex] = useState<number | null>(null);
  const isXSmall = useMediaQuery(theme.breakpoints.down('xs'));
  const textStyle: any = {};
  const onClickCard = (cartIndex: number) => {
    setSelectedCartIndex(cartIndex);
    setIsItemModalOpen(true);
  };
  const onCloseItemModal = () => {
    setSelectedCartIndex(null);
    setIsItemModalOpen(false);
  }
  const onClickRemove = (index: number) => {
    removeCartItem(index)
  }
  const onClickReview = () => {
    if (signedInUser) {
      navigate!(routes.reviewCart.getLink());
    } else {
      setNeedsSignInModal(true);
    }
  }
  const onSignUpSignIn = () => {
    setNeedsSignInModal(false);
    navigate!(routes.reviewCart.getLink());
  }
  if (isXSmall) {
    textStyle.lineHeight = 'normal';
  }

  useEffect(() => {
    if (orderId) getCartFromOrderId(orderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (!loading && !error && called && !data) {
    return (
      <Container className={classes.container}>
        <Typography className={classes.notFound} variant='h4'>
          Cart not found. Please start a new cart.
        </Typography>
      </Container>
    );
  }

  // we received data from server, but are waiting for redux to get cart
  if (orderId && !cart) {
    return null;
  }

  if (!cart) {
    return <Typography variant='h1'className={classes.emptyCart}>Cart is empty</Typography> 
  };
  return (
    <Container className={classes.container}>
      {selectedCartIndex !== null && (
        <UpdateCartItemModal
          cartItem={cart.Items[selectedCartIndex]}
          customerItem={getCustomerItemFromCartItem(cart, cart.Items[selectedCartIndex])}
          open={isItemModalOpen}
          onClose={onCloseItemModal}
          targetIndex={selectedCartIndex}
        />
      )}
      {needsSignInModal && <SignInModal onSignUpSignIn={onSignUpSignIn} open={needsSignInModal} onClose={() => setNeedsSignInModal(false)} />}
      <Typography gutterBottom variant='h4'>{cart.RestName} cart</Typography>
      <CartItemList onRemoveCartItem={onClickRemove} onClickCard={onClickCard} />
      <Button
        color='primary'
        variant='contained'
        className={classes.review}
        onClick={onClickReview}
      >
        Review cart
      </Button>
    </Container>
  );
}

const mapStateToProps = (state: RootState) => ({
  cart: state.OrderingFlow.cart,
  signedInUser: state.Account.SignedInUser,
});

const mapDispatchToProps = (dispatch: ThunkDispatch<RootState, null, RootActions>) => ({
  removeCartItem: (cartIndex: number) => dispatch(removeCartItemAction(cartIndex))
})

export default connect(mapStateToProps, mapDispatchToProps)(CartPage);
