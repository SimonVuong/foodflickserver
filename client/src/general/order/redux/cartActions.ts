import { Cart } from 'general/order/CartModel';
import { AsyncAction } from 'general/redux/store';
import { CustomerRest } from 'general/rest/models/CustomerRestModel';
import { getNewCartItem, CartItem } from 'general/order/CartItemModel';
import { ORDERING_FLOW } from 'general/redux/flows/ordering/orderingReducer';
import { Price, Option } from 'general/menu/models/BaseItemModel';
import { notificationSuccessAction } from 'general/redux/ui/notification/notificationActions';
import { SignedInUser } from 'general/account/SignedInUserModel';

export enum CartActionTypes {
  ADD_CART_ITEM = 'ADD_CART_ITEM',
  CLEAR_CART = 'CLEAR_CART',
  REMOVE_CART_ITEM = 'REMOVE_CART_ITEM',
  UPDATE_CART_ITEM = 'UPDATE_CART_ITEM',
  SET_CART = 'SET_CART',
}

interface AddCartItemAction {
  type: CartActionTypes.ADD_CART_ITEM
  flow: typeof ORDERING_FLOW
  item: CartItem
  rest: CustomerRest
  signedInUser?: SignedInUser
}

interface ClearCartAction {
  type: CartActionTypes.CLEAR_CART
  flow: typeof ORDERING_FLOW
}

interface RemoveCartItemAction {
  type: CartActionTypes.REMOVE_CART_ITEM
  flow: typeof ORDERING_FLOW
  cartIndex: number
}

interface SetCartAction {
  type: CartActionTypes.SET_CART
  flow: typeof ORDERING_FLOW
  cart: Cart
}

interface UpdateCartItemAction {
  type: CartActionTypes.UPDATE_CART_ITEM
  flow: typeof ORDERING_FLOW
  targetIndex: number
  newItem: CartItem
}

export type CartActions =
AddCartItemAction
| ClearCartAction
| RemoveCartItemAction
| UpdateCartItemAction
| SetCartAction

export const addCartItemAction = (
  categoryIndex: number,
  itemIndex: number,
  selectedPrice: Price,
  selectedOptions: Option[],
  quantity: number,
  specialRequests?: string
): AsyncAction => (dispatch, getState) => {
  const rest = getState().OrderingFlow.selectedRest!;
  const signedInUser = getState().Account.SignedInUser;
  dispatch({
    type: CartActionTypes.ADD_CART_ITEM,
    flow: ORDERING_FLOW,
    item: getNewCartItem(
      rest.Menu[categoryIndex].Items[itemIndex],
      selectedPrice,
      selectedOptions,
      quantity,
      specialRequests,
    ),
    rest,
    signedInUser,
  });
  dispatch(notificationSuccessAction('Added cart item'));
}

export const clearCartAction = (): ClearCartAction => ({
  type: CartActionTypes.CLEAR_CART,
  flow: ORDERING_FLOW,
})

export const removeCartItemAction = (cartIndex: number): AsyncAction => dispatch => {
  dispatch({
    type: CartActionTypes.REMOVE_CART_ITEM,
    flow: ORDERING_FLOW,
    cartIndex,
  });
  dispatch(notificationSuccessAction('Removed cart item'));
}

export const updateCartItemAction = (
  selectedPrice: Price,
  selectedOptions: Option[],
  quantity: number,
  specialRequests: string | undefined,
  targetIndex: number,
): AsyncAction => (dispatch, getState) => {
  const item: CartItem = getState().OrderingFlow.cart!.Items[targetIndex];
  const newItem = new CartItem({
    name: item.Name,
    flick: item.Flick,
    itemId: item.itemId,
    selectedPrice: selectedPrice,
    selectedOptions: selectedOptions,
    quantity: quantity,
    specialRequests: specialRequests,
  });
  dispatch({
    type: CartActionTypes.UPDATE_CART_ITEM,
    flow: ORDERING_FLOW,
    targetIndex,
    newItem,
  });
  dispatch(notificationSuccessAction('Updated cart item'));
}

export const setCartAction = (cart: Cart): SetCartAction => ({
  type: CartActionTypes.SET_CART,
  flow: ORDERING_FLOW,
  cart,
})
