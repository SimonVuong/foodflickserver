import React from 'react';
import OrderList from 'account/OrderList';
import { useGetMyPendingTipOrders } from 'general/order/orderService';
import { Typography } from '@material-ui/core';

const PendingTipOrders: React.FC = () => {
  const { loading, called, error, data } = useGetMyPendingTipOrders();
  if (!called || error) return null;
  if (loading) return <Typography variant='h5'>Loading...</Typography>;
  return <OrderList orders={data!} title='Orders with adjustable tips' />
}

export default PendingTipOrders;
