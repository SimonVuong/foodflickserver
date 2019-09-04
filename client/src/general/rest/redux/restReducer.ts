import { CustomerRest } from 'general/rest/models/CustomerRestModel';
import { RestActionTypes, RestActions } from './restActions';

export type SelectedRestStateReducer = CustomerRest | null | undefined;

export function selectedRestReducer(state: SelectedRestStateReducer = null , action: RestActions): SelectedRestStateReducer {
  switch(action.type) {
    case RestActionTypes.SELECT_REST:
      return action.rest;
    default:
      return state
  }
}
