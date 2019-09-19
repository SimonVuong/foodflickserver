import React, { useState } from 'react';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { Typography, Container, Button, TextField, InputAdornment, Grid, Divider } from '@material-ui/core';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { Order, OrderStatus } from 'general/order/OrderModel';
import { round2 } from 'general/utils/math';
import { RouteComponentProps } from '@reach/router'
import CartItemList from 'cart/CartItemList';
import WithLoader from 'general/components/lib/WithLoader';
import { useUpdateTip } from 'general/order/orderService';

const useStyles = makeStyles((theme: Theme) => ({
  update: {
    margin: theme.spacing(2, 0),
    width: '100%',
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
  divider: {
    margin: theme.spacing(2, 0),
  }
}));

type staticTip = 0.15 | 0.20 | 0.25 | 0.30 | null;
const isStaticTip = (percent: number): boolean =>
  percent === 0.15
  || percent === 0.20
  || percent === 0.25
  || percent === 0.30;

const OrderSummaryPage: React.FC<RouteComponentProps> = ({ location }) => {
  const classes = useStyles();
  const order = new Order(location!.state.order);
  const [updateTip, updateTipRes] = useUpdateTip();
  const percentTip = round2(order.Costs.TipPercent);
  const defaultStaticTip = isStaticTip(percentTip) ? percentTip as staticTip : null;
  const [staticTip, setStaticTip] = useState<staticTip>(defaultStaticTip);
  const defaultCustomTip = defaultStaticTip === null ? order.Costs.Tip.toString() : '';
  const [customTip, setCustomTip] = useState<string>(defaultCustomTip);

  const onChooseTip = (tip: staticTip) => {
    setStaticTip(tip);
    setCustomTip('');
  }
  const customTipChange = (tip: string) =>  {
    setCustomTip(tip);
    setStaticTip(null);
  }
  const costs = order.Costs;
  const itemTotal = round2(costs.ItemTotal);
  const tax = round2(costs.Tax);
  let tip = round2(staticTip ? round2((itemTotal * staticTip)) : round2(parseFloat(customTip)));
  if (isNaN(tip)) {
    tip = 0;
  }

  const onUpdateTip = () => {
    updateTip(order._Id, tip);
  }

  const total = round2(itemTotal + tax + tip);
  const canUpdateTip = order.Status === OrderStatus.PENDING_TIP_CHANGE;
  return (
    <Container className={classes.container}>
      <Typography gutterBottom variant='h4'>{order.RestName} order summary</Typography>
      <CartItemList items={order.Items} />
      <div className={classes.section}>
        <Typography gutterBottom variant='h6'>Payment</Typography>
        <div className={classes.hiddenCard}>
          <Typography variant='subtitle2'>
            {order.Card ? order.Card.HiddenString : 'N/A'}
          </Typography>
        </div>
      </div>
      <div className={classes.section}>
        <Typography variant='h6'>Contact</Typography>
        <Typography variant='subtitle2'>{order.Phone}</Typography>
      </div>
      <div className={classes.section}>
        <Typography gutterBottom variant='h6'>Carry out or sitdown?</Typography>
        <Typography variant='subtitle2'>{order.OrderType}</Typography>
      </div>
      {
        <div className={classes.section}>
          <Typography gutterBottom variant='h6'>Tip</Typography>
          {
            order.Status !== OrderStatus.PENDING_TIP_CHANGE &&
            <>
              <Typography gutterBottom variant='subtitle2'>{tip}</Typography>
              <Typography variant='body2' color='textSecondary'>Tips can only be updated for pending-tip orders</Typography>
            </>
          }
          {
            canUpdateTip &&
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
          }
        </div>
      }
      <Divider className={classes.divider} variant='middle' />
      <div className={classes.costs}>
        <div>
          <Typography variant='subtitle1' className={classes.costLabel}>Items:</Typography>
          <Typography variant='subtitle1' className={classes.costLabel}>Tax:</Typography>
          <Typography variant='subtitle1' className={classes.costLabel}>Tip:</Typography>
          <Typography variant='subtitle1' className={classes.costLabel}>Total:</Typography>
        </div>
        <div className={classes.costNumbers}>
          <Typography variant='subtitle1'>{itemTotal}</Typography>
          <Typography variant='subtitle1'>{tax}</Typography>
          <Typography variant='subtitle1'>{tip}</Typography>
          <Typography variant='subtitle1'>{total}</Typography>
        </div>
      </div>
      {
        canUpdateTip &&
        <WithLoader fullWidth isLoading={updateTipRes.loading}>
          <Button
            color='primary'
            variant='contained'
            className={classes.update}
            onClick={onUpdateTip}
          >
            Update tip
          </Button>
        </WithLoader>
      }
    </Container>
  );
}

export default OrderSummaryPage;

