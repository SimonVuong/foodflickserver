import React from 'react';
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Divider from '@material-ui/core/Divider';
import ListItemText from '@material-ui/core/ListItemText';
import { ListItemSecondaryAction } from '@material-ui/core';
import { Order } from 'general/order/OrderModel';
import { displayDateTime } from 'general/utils/dateTime';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    list: {
      width: '100%',
    },
  }),
);

type props = {
  orders: Order[],
}

const OrderList: React.FC<props> = ({ orders }) => {
  const classes = useStyles();
  return (
    <List className={classes.list} disablePadding>
      {orders.map((order, index) => (
        <div key={index}>
          <ListItem>
            <ListItemText
              primary={order.RestName}
              secondary={displayDateTime(order.CartUpdatedDate)}
            />
            <ListItemSecondaryAction>
              {order.Costs.Total}
            </ListItemSecondaryAction>
          </ListItem>
          {index < orders.length - 1 ? <Divider variant="middle" /> : null}
        </div>
      ))}
    </List>
  );
}

export default OrderList;