import { CartActions, CartActionTypes } from './cartActions';
import { Cart } from 'general/order/CartModel';
import { OrderType } from 'general/order/OrderModel';
export type CartStateReducer = Cart | null | undefined;

export const cartReducer = (state: CartStateReducer = null, action: CartActions): CartStateReducer => {
  switch (action.type) {
    case CartActionTypes.ADD_CART_ITEM: {
      if (state === null) {
        // although we don't technically need to init phone and cardTok until ReviewCartPage, we do so as early as
        // possible to ensure the cart reducer is up to date up to the point of ordering.
        const phone = action.signedInUser ? action.signedInUser.Phone : undefined;
        const cardTok = action.signedInUser && action.signedInUser.Card ? action.signedInUser.Card.cardTok : undefined;
        return new Cart({
          restId: action.rest._id,
          items: [action.item],
          tableNumber: undefined,
          orderType: OrderType.SIT_DOWN,
          restMenu: action.rest.Menu,
          restName: action.rest.Name,
          phone,
          cardTok,
        })
      }
      const cartCopy = new Cart(state);
      cartCopy.addItem(action.item);
      return cartCopy;
    }
    case CartActionTypes.CLEAR_CART: {
      return null;
    }
    case CartActionTypes.REMOVE_CART_ITEM: {
      const cartCopy = new Cart(state!);
      cartCopy.removeItem(action.cartIndex);
      if (cartCopy.Items.length === 0) return null;
      return cartCopy;
    }
    case CartActionTypes.UPDATE_CART_ITEM: {
      const cartCopy = new Cart(state!);
      const { targetIndex, newItem } = action;
      cartCopy.updateItem(targetIndex, newItem);
      return cartCopy;
    }
    case CartActionTypes.SET_CART: {
      return action.cart;
    }
    default:
      return state
  }
}