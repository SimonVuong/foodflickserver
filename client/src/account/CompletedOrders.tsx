import React from 'react';
import OrderList from 'account/OrderList';
import { useGetMyCompletedOrders } from 'general/order/orderService';
import { Typography } from '@material-ui/core';

const CompletedOrders: React.FC = () => {
  const { loading, called, error, data } = useGetMyCompletedOrders();
  if (!called || error) return null;
  if (loading) return <Typography variant='h5'>Loading...</Typography>;
  return <OrderList orders={data!} title='Orders completed' />
}

export default CompletedOrders;
