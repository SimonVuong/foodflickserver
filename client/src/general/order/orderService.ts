import { orderFragment } from './orderFragment';
import { notificationSuccessAction, notificationErrorAction } from 'general/redux/ui/notification/notificationActions';
import { Cart } from 'general/order/CartModel';
import gql from 'graphql-tag';
import { useMutation, useLazyQuery, useQuery } from '@apollo/react-hooks';
import { MutationResult, QueryResult } from '@apollo/react-common';
import { useEffect, useMemo } from 'react';
import { getStore } from 'general/redux/store';
import { clearCartAction, setCartAction } from 'general/order/redux/cartActions';
import { cartFragment } from './cartFragment';
import { Order } from './OrderModel';

const getCartInput = (cart: Cart) => {
  const newCart: any = new Cart(cart);
  delete newCart.restName;
  delete newCart.restMenu;
  delete newCart.restUrl;
  for (let i = 0; i < newCart.items.length; i++) {
    delete newCart.items[i].flick;
  }
  return newCart
}

const useGetCartFromOrderId = (): [
  (orderId: string) => void,
  { data: Cart | undefined } & QueryResult<any, Record<string, any>>
] => {
  type res = {
    cartFromOrder: Cart
  }
  const [query, queryRes] = useLazyQuery<res>(gql`
    query cartFromOrder($orderId: ID!) {
      cartFromOrder(orderId: $orderId) {
        ...cartFragment
      }
    }
    ${cartFragment}
  `);
  const cart = useMemo(() => (
    queryRes.data && queryRes.data.cartFromOrder ? new Cart(queryRes.data.cartFromOrder) : undefined
  ), [queryRes.data]);
  
  useEffect(() => {
    if (cart) {
      const newCart = new Cart(cart)
      getStore().dispatch(setCartAction(newCart));
    }
    if (queryRes.error) {
      getStore().dispatch(notificationErrorAction(queryRes.error.message));
    }
  }, [cart, queryRes.error]);
  return [
    (orderId: string) => query({ variables: { orderId }}),
    {
      ...queryRes,
      data: cart
    }
  ]
}

const useGetMyCompletedOrders = () => {
  type res = {
    myCompletedOrders: Order[]
  }
  const queryRes = useQuery<res>(gql`
    query {
      myCompletedOrders {
        ...orderFragment
      }
    }
    ${orderFragment}
  `, {
    fetchPolicy: 'no-cache',
  });

  const orders = useMemo(() => (
    queryRes.data && queryRes.data.myCompletedOrders ? queryRes.data.myCompletedOrders.map(order => new Order(order)) : undefined
  ), [queryRes.data]);

  if (queryRes.error) {
    getStore().dispatch(notificationErrorAction(`Failed to get orders: ${queryRes.error}`));
  }

  return {
    ...queryRes,
    data: orders
  }
}

const useGetMyOpenOrders = () => {
  type res = {
    myOpenOrders: Order[]
  }
  const queryRes = useQuery<res>(gql`
    query {
      myOpenOrders {
        ...orderFragment
      }
    }
    ${orderFragment}
  `, {
    fetchPolicy: 'no-cache',
  });

  const orders = useMemo(() => (
    queryRes.data && queryRes.data.myOpenOrders ? queryRes.data.myOpenOrders.map(order => new Order(order)) : undefined
  ), [queryRes.data]);
  
  if (queryRes.error) {
    getStore().dispatch(notificationErrorAction(`Failed to get orders: ${queryRes.error}`));
  }

  return {
    ...queryRes,
    data: orders
  }
}

const useGetMyPendingTipOrders = () => {
  type res = {
    myPendingTipOrders: Order[]
  }
  const queryRes = useQuery<res>(gql`
    query {
      myPendingTipOrders {
        ...orderFragment
      }
    }
    ${orderFragment}
  `, {
    fetchPolicy: 'no-cache',
  });

  const orders = useMemo(() => (
    queryRes.data && queryRes.data.myPendingTipOrders ? queryRes.data.myPendingTipOrders.map(order => new Order(order)) : undefined
  ), [queryRes.data]);
  
  if (queryRes.error) {
    getStore().dispatch(notificationErrorAction(`Failed to get orders: ${queryRes.error}`));
  }

  return {
    ...queryRes,
    data: orders
  }
}

const usePlaceOrder = (): [
  (cart: Cart) => void,
  MutationResult<boolean | undefined>
] => {
  type res = { placeOrder: boolean }
  type vars = { cart: Cart };
  const [mutate, mutation] = useMutation<res, vars>(gql`
    mutation placeOrder($cart: CartInput!) {
      placeOrder(cart: $cart)
    }
  `);
  const placeOrder = (cart: Cart) => {
    const cartInput = getCartInput(cart);
    mutate({ variables: { cart: cartInput, } })
  }
  useEffect(() => {
    if (mutation.error) {
      getStore().dispatch(notificationErrorAction(`Order failed: ${mutation.error}`));
    } else if (mutation.data && mutation.data.placeOrder) {
      getStore().dispatch(notificationSuccessAction('Order successful'));
      getStore().dispatch(clearCartAction());
    } else if (mutation.data && !mutation.data.placeOrder) {
      getStore().dispatch(notificationErrorAction(`Sorry. Something went wrong. Please speak with your server`));
    }
  }, [mutation]);

  return [
    placeOrder,
    {
      ...mutation,
      data: mutation.data ? mutation.data.placeOrder : undefined,
    }
  ]
}

const useUpdateTip = (): [
  (orderId: string, newTip: number) => void,
  MutationResult<boolean | undefined>
] => {
  type res = { updateTip: boolean }
  type vars = { orderId: string, newTip: number };
  const [mutate, mutation] = useMutation<res, vars>(gql`
    mutation updateTip($orderId: ID!, $newTip: Float!) {
      updateTip(orderId: $orderId, newTip: $newTip)
    }
  `);
  const updateTip = (orderId: string, newTip: number) => {
    mutate({ variables: { orderId, newTip } })
  }
  useEffect(() => {
    if (mutation.error) {
      getStore().dispatch(notificationErrorAction(`Order failed: ${mutation.error}`));
    }
    if (mutation.data && mutation.data.updateTip) {
      getStore().dispatch(notificationSuccessAction('Tip updated'));
    }
  }, [mutation]);

  return [
    updateTip,
    {
      ...mutation,
      data: mutation.data ? mutation.data.updateTip : undefined,
    }
  ]
}

export {
  usePlaceOrder,
  useGetCartFromOrderId,
  useGetMyCompletedOrders,
  useGetMyOpenOrders,
  useGetMyPendingTipOrders,
  useUpdateTip,
}
