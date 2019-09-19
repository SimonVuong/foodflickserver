import React from 'react';
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Divider from '@material-ui/core/Divider';
import ListItemText from '@material-ui/core/ListItemText';
import { ListItemSecondaryAction, Link, Paper, Typography } from '@material-ui/core';
import { Order } from 'general/order/OrderModel';
import { displayDateTime } from 'general/utils/dateTime';
import { Link as RouterLink } from '@reach/router';
import { routes } from 'general/routes/routes';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    list: {
      width: '100%',
    },
    paper: {
      width: '100%',
      margin: theme.spacing(1, 0)
    },
    text: {
      padding: theme.spacing(1, 1 , 0),
    }
  }),
);

type props = {
  orders: Order[],
  title: string,
}

const OrderList: React.FC<props> = ({ orders, title }) => {
  const classes = useStyles();
  return (
    <Paper className={classes.paper}>
      <Typography variant='h5' className={classes.text}>{title}</Typography>
      {orders.length === 0 && <Typography variant='subtitle2' className={classes.text}>None</Typography>}
      <List className={classes.list} disablePadding>
        {orders.map((order, index) => (
          <Link
            key={index}
            color='textPrimary'
            component={RouterLink}
            to={routes.orderSummary.getLink(order._Id)}
            state={{ order }} 
          >
            <ListItem button>
              <ListItemText
                primary={order.RestName}
                secondary={displayDateTime(order.CartUpdatedDate)}
              />
              <ListItemSecondaryAction>
                {order.Costs.Total}
              </ListItemSecondaryAction>
            </ListItem>
            {index < orders.length - 1 ? <Divider variant="middle" /> : null}
          </Link>
        ))}
      </List>
    </Paper>
  );
}

export default OrderList;