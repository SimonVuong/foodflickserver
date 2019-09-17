import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import OrderList from 'account/OrderList';
import { useGetMyCompletedOrders } from 'general/order/orderService';
import { Paper, Typography } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  paper: {
    width: '100%',
    margin: theme.spacing(1, 0)
  },
  title: {
    padding: theme.spacing(1, 1 , 0),
  }
}));

const CompletedOrders: React.FC = () => {
  const classes = useStyles();
  const { loading, called, error, data } = useGetMyCompletedOrders();
  if (!called || error) return null;
  if (loading) return <Typography variant='h5'>Loading...</Typography>;
  return (
    <Paper className={classes.paper}>
      <Typography variant='h5' className={classes.title}>
        Completed orders
      </Typography>
      <OrderList orders={data!}/>
    </Paper>
  );
}

export default CompletedOrders;
