import { CustomerRest } from 'general/rest/models/CustomerRestModel';
import { ORDERING_FLOW } from 'general/redux/flows/ordering/orderingReducer';

export enum RestActionTypes {
  SELECT_REST = 'SELECT_REST',
}

interface SelectRestAction {
  type: RestActionTypes.SELECT_REST
  flow: typeof ORDERING_FLOW
  rest: CustomerRest | null
}

export type RestActions = SelectRestAction

export const selectOrderingRestAction = (rest: CustomerRest): SelectRestAction => ({
  type: RestActionTypes.SELECT_REST,
  flow: ORDERING_FLOW,
  rest
})
