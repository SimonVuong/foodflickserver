import React, { useState, useEffect } from 'react';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { RootState, RootActions } from 'general/redux/rootReducer';
import { connect } from 'react-redux';
import { CartStateReducer } from 'general/order/redux/cartReducer';
import { Typography, Link, Container, Button, TextField, InputAdornment, Grid, Divider, IconButton } from '@material-ui/core';
import { ThunkDispatch } from 'redux-thunk';
import { removeCartItemAction } from 'general/order/redux/cartActions';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ArrowBack from '@material-ui/icons/ArrowBack';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import CartItemList from './CartItemList';
import { Cart } from 'general/order/CartModel';
import { OrderType } from 'general/order/OrderModel';
import { SignedInUser } from 'general/account/SignedInUserModel';
import CardForm from './CardForm';
import { injectStripe, Elements, StripeProvider, ReactStripeElements } from 'react-stripe-elements';
import { activeConfig } from 'config';
import WithLoader from 'general/components/lib/WithLoader';
import { notificationSuccessAction, notificationErrorAction } from 'general/redux/ui/notification/notificationActions';
import { round2 } from 'general/utils/math';
import { updateCardAction } from 'general/account/accountActions';
import EditIcon from '@material-ui/icons/Create';
import { Card } from 'general/card/CardModel';
import { usePlaceOrder } from 'general/order/orderService';
import { routes } from 'general/routes/routes';
import { Link as RouterLink } from '@reach/router';
import AnalyticsService from 'analytics/analyticsService';
import events from 'analytics/events';
import { SelectedRestStateReducer } from 'general/rest/redux/restReducer';
import { navigate } from '@reach/router'

const useStyles = makeStyles((theme: Theme) => ({
  review: {
    margin: theme.spacing(2, 0),
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  costLabel: {
    fontWeight: 400,
  },
  costs: {
    display: 'flex',
    justifyContent: 'space-around'
  },
  costNumbers: {
    textAlign: 'right',
  },
  hiddenCard: {
    display: 'flex',
    alignItems: 'center',
  },
  toggleButtonGroup: {
    width: '100%',
  },
  section: {
    paddingTop: theme.spacing(1),
  },
  customTip: {
    width: 115,
  },
  customTipSection: {
    display: 'flex',
    alignItems: 'flex-end',
  },
  title: {
    display: 'flex',
    verticalAlign: 'center',
  },
  divider: {
    margin: theme.spacing(2, 0),
  }
}));

type props = {
  cart: CartStateReducer,
  notifyCardSaved: () => void,
  notifyCardSaveError: (reason: string) => void,
  selectedRest: SelectedRestStateReducer,
  signedInUser?: SignedInUser,
  updateCard: (newCardTok: string) => Promise<void>,
};

type staticTip = 0.15 | 0.20 | 0.25 | 0.30 | null;

const ReviewCartPage: React.FC<props & ReactStripeElements.InjectedStripeProps> = ({
  cart,
  notifyCardSaved,
  notifyCardSaveError,
  selectedRest,
  signedInUser,
  stripe,
  updateCard,
}) => {
  useEffect(() => {
    if (signedInUser) {
      setHiddenCard(signedInUser.Card || null);
      setCardTok(signedInUser.Card ? signedInUser.Card.cardTok : '');
      setPhone(signedInUser.Phone);
    }
  }, [signedInUser])

  // if items were added to cart while signed in, then cart already has the proper initial values so use those. however,
  // if items were added to cart before signin, then cart was not initialized with phone and cardTok so get it from the
  // signedInUser; technically we can always grab the signedInUser value (since the cart grabs from signedInUser),
  // but we grab from cart first as it makes sense that the cart's values take priority over signedInUser and are also
  // "closer"
  let initialCardTok = cart && cart.CardTok ? cart.CardTok : null;
  if (!initialCardTok) initialCardTok = signedInUser && signedInUser.Card ? signedInUser.Card.CardTok : null;
  let initialPhone = cart && cart.Phone ? cart.Phone : null;
  if (!initialPhone) initialPhone = signedInUser ? signedInUser.Phone : '';

  const classes = useStyles();
  const [hiddenCard, setHiddenCard] = useState<Card | null>(null);
  const [cardTok, setCardTok] = useState<string | null>(initialCardTok);
  const [phone, setPhone] = useState<string>(initialPhone);
  const [tableError, setTableError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [staticTip, setStaticTip] = useState<staticTip>(0.20);
  const [customTip, setCustomTip] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [orderType, setOrderType] = useState<OrderType>(OrderType.SIT_DOWN);
  const [isSavingCard, setIsSavingCard] = useState<boolean>(false);
  const [placeOrder, placeOrderRes] = usePlaceOrder();
  if (placeOrderRes.data && selectedRest) {
    navigate(routes.menuBrowser.getLink(selectedRest.Url));
    return null;
  }
  const doesPassRequirements = (): boolean => {
    let tableErrorMsg = '';
    let phoneErrorMsg = '';

    if (!tableNumber && orderType === OrderType.SIT_DOWN) {
      tableErrorMsg = 'Table # cannot be empty';
    }
    if (!phone) {
      phoneErrorMsg = 'Phone cannot be empty';
    }

    setTableError(tableErrorMsg);
    setPhoneError(phoneErrorMsg);
    return !tableErrorMsg && !phoneErrorMsg
  }
  const onSaveCard = async () => {
    setIsSavingCard(true);
    const res = await stripe!.createToken({ name: (signedInUser && signedInUser.FullName) ? signedInUser.FullName : '' });
    if (res.error) {
      notifyCardSaveError(res.error.message || 'Reason unknown');
      setIsSavingCard(false);
      return;
    }
    const cardTok = res.token!.id;
    await updateCard(cardTok);
    setCardTok(cardTok);
    setIsSavingCard(false);
    notifyCardSaved();
  };
  const onChooseTip = (tip: staticTip) => {
    setStaticTip(tip);
    setCustomTip('');
  }
  const customTipChange = (tip: string) => {
    setCustomTip(tip);
    setStaticTip(null);
  }
  const onChangeTable = (table: string) => {
    if (!table) setTableError('Table # cannot be empty');
    if (tableError) setTableError('');
    setTableNumber(table)
  }
  const onChangePhone = (phone: string) => {
    if (!phone) setPhoneError('Phone cannot be empty');
    if (phoneError) setPhoneError('');
    setPhone(phone);
  }
  // should never happen
  if (!cart || !selectedRest) return <Typography variant='h3'>Empty cart</Typography>;

  const itemTotal = round2(cart.ItemTotal);
  const estimatedTax = round2(cart.ItemTotal * selectedRest.TaxRate);
  let tip = 0;
  if (orderType === OrderType.SIT_DOWN) {
    tip = staticTip ? round2((cart.ItemTotal * staticTip)) : round2(parseFloat(customTip));
  }
  if (isNaN(tip)) tip = 0;
  const total = round2(itemTotal + estimatedTax + tip);

  const onPlaceOrder = async () => {
    let orderCardTok = cardTok;

    if (!orderCardTok) {
      const res = await stripe!.createToken({ name: (signedInUser && signedInUser.FullName) ? signedInUser.FullName : '' });
      if (res.error) return;
      orderCardTok = res.token!.id;
    }

    const isOrderValid = doesPassRequirements();
    if (isOrderValid) {
      AnalyticsService.trackEvent(events.CLICKED_PLACE_ORDER)
      placeOrder(new Cart({
        ...cart,
        phone,
        cardTok: orderCardTok!,
        orderType,
        tableNumber: tableNumber ? tableNumber : undefined,
        tip,
      }));
    }
  };
  return (
    <Container className={classes.container}>
      <div className={classes.title}>
        <Link color='textPrimary' component={RouterLink} to={routes.cart.getLink()}>
          <ArrowBack fontSize='large' />
        </Link>
        <Typography gutterBottom variant='h4'>{cart.RestName} review</Typography>
      </div>
      <CartItemList items={cart.Items} />
      <div className={classes.section}>
        <Typography gutterBottom variant='h6'>Payment</Typography>
        {hiddenCard && cardTok ?
          <div className={classes.hiddenCard}>
            <Typography variant='subtitle2'>{hiddenCard.HiddenString}</Typography>
            <IconButton onClick={() => {
              setHiddenCard(null);
              setCardTok(null);
            }}>
              <EditIcon fontSize='small' />
            </IconButton>
          </div>
          :
          <>
            <CardForm />
            <WithLoader isLoading={isSavingCard}>
              <Button
                color='secondary'
                variant='outlined'
                onClick={onSaveCard}
                disabled={isSavingCard}
              >
                Save card
              </Button>
            </WithLoader>
          </>
        }
      </div>
      <div className={classes.section}>
        <Typography variant='h6'>Contact</Typography>
        <TextField
          fullWidth
          label='Phone'
          error={!!phoneError}
          helperText={phoneError}
          value={phone}
          onChange={e => onChangePhone(e.target.value)}
          margin='normal'
        />
      </div>
      <div className={classes.section}>
        <Typography gutterBottom variant='h6'>Carry out or sitdown?</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <ToggleButtonGroup
              exclusive
              size='small'
              className={classes.toggleButtonGroup}
              value={orderType}
              onChange={(e, method) => setOrderType(method)}
            >
              <ToggleButton value={OrderType.SIT_DOWN}>
                Sit down
              </ToggleButton>
              <ToggleButton value={OrderType.CARRY_OUT}>
                Carry out
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          {orderType === OrderType.SIT_DOWN &&
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Table number'
                error={!!tableError}
                helperText={tableError}
                value={tableNumber}
                onChange={e => onChangeTable(e.target.value)}
                margin='normal'
              />
            </Grid>
          }
        </Grid>
      </div>
      {orderType === OrderType.SIT_DOWN &&
        <div className={classes.section}>
          <Typography gutterBottom variant='h6'>Tip</Typography>
          <Typography gutterBottom variant='body2' color='textSecondary'>Tip is paid with your order, but you can change it within 3 hours after ordering.</Typography>
          <Grid container spacing={2}>
            <Grid item sm={6} xs={12}>
              <ToggleButtonGroup
                exclusive
                size='small'
                className={classes.toggleButtonGroup}
                value={staticTip}
                onChange={(e, tip) => onChooseTip(tip)}
              >
                <ToggleButton value={0.15}>
                  15%
                </ToggleButton>
                <ToggleButton value={0.20}>
                  20%
                </ToggleButton>
                <ToggleButton value={0.25}>
                  25%
                </ToggleButton>
                <ToggleButton value={0.30}>
                  30%
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            <Grid item sm={6} xs={12}>
              <div className={classes.customTipSection}>
                <Typography variant='subtitle1' color='secondary' className={classes.customTip}>Custom tip</Typography>
                <TextField
                  type='number'
                  fullWidth
                  value={customTip}
                  onChange={e => customTipChange(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position='start'>$</InputAdornment>,
                  }}
                />
              </div>
            </Grid>
          </Grid>
        </div>
      }
      <Divider className={classes.divider} variant='middle' />
      <div className={classes.costs}>
        <div>
          <Typography variant='subtitle1' className={classes.costLabel}>Items:</Typography>
          <Typography variant='subtitle1' className={classes.costLabel}>Estimated tax:</Typography>
          <Typography variant='subtitle1' className={classes.costLabel}>Auto tip:</Typography>
          <Typography variant='subtitle1' className={classes.costLabel}>Total:</Typography>
        </div>
        <div className={classes.costNumbers}>
          <Typography variant='subtitle1'>{itemTotal}</Typography>
          <Typography variant='subtitle1'>{estimatedTax}</Typography>
          <Typography variant='subtitle1'>{tip}</Typography>
          <Typography variant='subtitle1'>{total}</Typography>
        </div>
      </div>
      <Button
        color='primary'
        variant='contained'
        className={classes.review}
        onClick={onPlaceOrder}
      >
        Place order
      </Button>
    </Container>
  );
}

const mapStateToProps = (state: RootState) => ({
  cart: state.OrderingFlow.cart,
  selectedRest: state.OrderingFlow.selectedRest,
  signedInUser: state.Account.SignedInUser,
});

const mapDispatchToProps = (dispatch: ThunkDispatch<RootState, null, RootActions>) => ({
  removeCartItem: (cartIndex: number) => dispatch(removeCartItemAction(cartIndex)),
  notifyCardSaveError: (reason: string) => dispatch(notificationErrorAction(`Card failed to save: ${reason}`)),
  notifyCardSaved: () => dispatch(notificationSuccessAction('Card saved')),
  updateCard: async (newCardTok: string) => await dispatch(updateCardAction(newCardTok)),
})

const ReviewCartPageContainer = connect(mapStateToProps, mapDispatchToProps)(injectStripe(ReviewCartPage));

export default () => (
  <StripeProvider apiKey={activeConfig.stripe.key}>
    <Elements>
      <ReviewCartPageContainer />
    </Elements>
  </StripeProvider>
)
