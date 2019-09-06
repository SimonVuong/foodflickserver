import { Cart } from 'general/order/CartModel';
import { CustomerRest } from 'general/rest/models/CustomerRestModel';
import { CartActions } from 'general/order/redux/cartActions';
import { selectedRestReducer, SelectedRestStateReducer } from 'general/rest/redux/restReducer';
import { cartReducer, CartStateReducer } from 'general/order/redux/cartReducer';
import { RestActions } from 'general/rest/redux/restActions';

export const ORDERING_FLOW = 'ORDERING_FLOW';

export class OrderingFlowState {
  private readonly _selectedRest: SelectedRestStateReducer;
  private readonly _cart: CartStateReducer;

  public constructor(selectedRest: SelectedRestStateReducer, cart: CartStateReducer) {
    this._selectedRest = selectedRest ? new CustomerRest(selectedRest) : selectedRest;
    this._cart = cart ? new Cart(cart) : cart;
  }
  
  public get selectedRest() { return this._selectedRest }
  
  public get cart() { return this._cart }
};

const initialState: OrderingFlowState = new OrderingFlowState(undefined, null);

export type OrderingActions = RestActions | CartActions

export const orderingFlowReducer = (state = initialState, action: OrderingActions): OrderingFlowState => {
  switch(action.flow) {
    case ORDERING_FLOW:
      return new OrderingFlowState(
        selectedRestReducer(state.selectedRest, action as RestActions),
        cartReducer(state.cart, action as CartActions)
      );
    default:
      return state
  }
}
