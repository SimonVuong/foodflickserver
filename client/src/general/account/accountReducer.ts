import { AccountActions, AccountActionTypes } from './accountActions';
import { SignedInUser } from './SignedInUserModel';

interface IAccountState {
  readonly signedInUser?: SignedInUser
}

export class AccountState implements IAccountState{
  readonly signedInUser?: SignedInUser;

  public constructor({
    signedInUser,
  }: IAccountState) {
    this.signedInUser = signedInUser;
  }
  
  public get SignedInUser() { return this.signedInUser }
};

const initialState: AccountState = new AccountState({});

export const accountReducer = (state = initialState, action: AccountActions): AccountState => {
  switch(action.type) {
    case AccountActionTypes.SIGN_IN:
      return new AccountState({
        signedInUser: action.signedInUser,
      });
    case AccountActionTypes.UPDATE_HIDDEN_CARD: {
      return new AccountState({
        signedInUser: new SignedInUser({
          ...state.SignedInUser!,
          card: action.hiddenCard,
        })
      });
    }
    default:
      return state
  }
}
