import { AccountActions } from 'general/account/accountActions';
import { AccountState, accountReducer } from 'general/account/accountReducer';
import { UiActions } from 'general/redux/ui/uiActions';
import { UiState, uiReducer } from 'general/redux/ui/uiReducer';
import { orderingFlowReducer, OrderingActions } from 'general/redux/flows/ordering/orderingReducer';
import { OrderingFlowState } from 'general/redux/flows/ordering/orderingReducer';

export class RootState {
  private readonly account?: AccountState
  private readonly orderingFlow?: OrderingFlowState
  private readonly ui?: UiState

  public constructor(
    account?: AccountState,
    orderingFlow?: OrderingFlowState,
    uiState?: UiState
  ) {
    this.account = account;
    this.orderingFlow = orderingFlow;
    this.ui = uiState;
  }

  public get Account() { return this.account! }
  public get OrderingFlow() { return this.orderingFlow! }
  public get Ui() { return this.ui! }
}

// setting to undefined to corresponding reducers can choose default values
const initialState: RootState = new RootState(undefined, undefined, undefined);

export type RootActions = OrderingActions | UiActions | AccountActions

export const getRootReducer = () => (state: RootState = initialState, action: RootActions) => new RootState(
  accountReducer(state.Account, action as AccountActions),
  orderingFlowReducer(state.OrderingFlow, action as OrderingActions),
  uiReducer(state.Ui, action as UiActions),
);
