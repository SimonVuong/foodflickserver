import { notificationSuccessAction, notificationErrorAction } from 'general/redux/ui/notification/notificationActions';
import { Cart } from 'general/order/CartModel';
import gql from 'graphql-tag';
import { useMutation, useLazyQuery } from '@apollo/react-hooks';
import { MutationResult, QueryResult } from '@apollo/react-common';
import { useEffect, useMemo } from 'react';
import { getStore } from 'general/redux/store';
import { clearCartAction, setCartAction } from 'general/order/redux/cartActions';
import { cartFragment } from './cartFragment';

const getCartInput = (cart: Cart) => {
  const newCart: any = new Cart(cart);
  delete newCart.restName;
  delete newCart.restMenu;
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
  if (queryRes.error) {

  }
  return [
    (orderId: string) => query({ variables: { orderId }}),
    {
      ...queryRes,
      data: cart
    }
  ]
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
    }
    if (mutation.data && mutation.data.placeOrder) {
      getStore().dispatch(notificationSuccessAction('Order successful'));
      getStore().dispatch(clearCartAction());
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

export {
  usePlaceOrder,
  useGetCartFromOrderId,
}
