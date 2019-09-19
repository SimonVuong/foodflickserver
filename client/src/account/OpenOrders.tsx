import React from 'react';
import OrderList from 'account/OrderList';
import { useGetMyOpenOrders } from 'general/order/orderService';
import { Typography } from '@material-ui/core';

const OpenOrders: React.FC = () => {
  const { loading, called, error, data } = useGetMyOpenOrders();
  if (!called || error) return null;
  if (loading) return <Typography variant='h5'>Loading...</Typography>;
  return <OrderList orders={data!} title='Orders processing' />
}

export default OpenOrders;
