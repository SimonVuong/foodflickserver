import { SignedInUser } from './SignedInUserModel';
import { activeConfig } from 'config';
import { notificationErrorAction } from '../redux/ui/notification/notificationActions';
import { KJUR } from 'jsrsasign';
import { AsyncAction } from 'general/redux/store';
import { AccountService } from './accountService';
import { Card } from 'general/card/CardModel';
import LogRocket from 'logrocket';

const jwtUtil = KJUR.jws.JWS

export const STORAGE_KEY = 'ff:refreshToken';

export enum AccountActionTypes {
  SIGN_IN = 'SIGN_IN',
  UPDATE_HIDDEN_CARD = 'UPDATE_HIDDEN_CARD',
}

export interface SignInAction {
  type: AccountActionTypes.SIGN_IN
  signedInUser: SignedInUser,
}

export interface UpdateHiddenCardAction {
  type: AccountActionTypes.UPDATE_HIDDEN_CARD
  hiddenCard: Card,
}

export type AccountActions = SignInAction | UpdateHiddenCardAction

const client_id = activeConfig.auth.clientId;
const audience = activeConfig.auth.audience;
const namespace = 'https://foodflick.com'; // the namespace for each custom jwt field
export const auth0Domain = `${activeConfig.auth.domain}/`

const getSignedInUser = (authJson: any): SignedInUser => {
  const {
    email,
    sub,
    [`${namespace}/card`]: card,
    [`${namespace}/firstName`]: firstName,
    [`${namespace}/lastName`]: lastName,
    [`${namespace}/phone`]: phone,
  } = jwtUtil.parse(authJson.id_token).payloadObj as any;
  LogRocket.identify(email);
  return new SignedInUser({
    accessToken: {
      token: authJson.access_token,
      type: authJson.token_type,
    },
    card,
    _id: sub,
    email,
    firstName,
    lastName,
    perms: null,
    phone,
  });
};

export const signUpAction = (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phone: string
): AsyncAction<Promise<boolean>> => async dispatch => {
  const isRestManager = false;
  const cardToken = '';
  try {
    const res = await fetch(auth0Domain + 'dbconnections/signup', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        audience,
        connection: 'Username-Password-Authentication',
        client_id,
        user_metadata: {
          firstName,
          lastName,
          phone,
          //'' for false string so field can be used as bool in auth0 hook. could not send json bool so converting to 
          //string. this field only being used to populate app_metadata in auth0 and so we never use
          //user_metadata.isRestManager again
          isRestManager: isRestManager ? 'true' : '',
          // '' for false string. this field is only being used to set stripeId in app_metadata and so we never use
          // user_medatadata.cardToken again
          cardToken: cardToken ? cardToken : '',
        }
      }),
    });
    const json = await res.json();
    if (!res.ok) throw json;
    dispatch(signInWithBasicAction(email, password));
    return true;
  } catch(e) {
    dispatch(notificationErrorAction(`Sign up failed: ${e.error || e.description}`));
    return false;
  }
}

export const signInWithBasicAction = (
  signInEmail: string,
  password: string
): AsyncAction<Promise<boolean>> => async dispatch => {
  try {
    const authRes = await fetch(auth0Domain + 'oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'password',
        username: signInEmail,
        password,
        scope: 'openid offline_access',
        client_id
      }),
    })
  
    const authJson: any = await authRes.json();
  
    if (!authRes.ok) throw authJson;
  
    //todo 1: make it so i dont have to sign in every time by using the refresh token
    // getNewAccessTokenBefore(dispatch, authJson.expires_int);
    // console.log('auth0 res', authJson);
    
    localStorage.setItem(STORAGE_KEY, authJson.refresh_token);
    
    dispatch({
      type: AccountActionTypes.SIGN_IN,
      signedInUser: getSignedInUser(authJson),
    });   
    return true; 
  } catch (e) {
    dispatch(notificationErrorAction(`Sign in failed: ${e.error_description}`));
    return false;
  }
};

export const signInWithRefreshAction = (refreshToken: string): AsyncAction => async dispatch => {
  const authRes = await fetch(auth0Domain + 'oauth/token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id
    }),
  });

  const authJson = await authRes.json();

  if (!authRes.ok) throw(authJson);

  // getNewAccessTokenBefore(dispatch, authJson.expires_int);
  // signInToFirebase(authJson.id_token);

  const signedInUser = getSignedInUser(authJson);
  dispatch({
    type: AccountActionTypes.SIGN_IN,
    signedInUser,
  });
  return signedInUser;
};

export const updateCardAction = (newCardTok: string): AsyncAction => async dispatch => {
  try {
    const newHiddenCard = await AccountService.updateCard(newCardTok);
    dispatch({
      type: AccountActionTypes.UPDATE_HIDDEN_CARD,
      hiddenCard: newHiddenCard,
    });
  } catch (e) {
    // todo 2. see what if i can get non-grqphl error
  }
}