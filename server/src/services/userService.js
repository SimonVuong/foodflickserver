import fetch from 'node-fetch';
import jwtUtil from 'jsonwebtoken';
import { NEEDS_MANAGER_SIGN_IN_ERROR, NEEDS_SIGN_IN_ERROR, getCannotBeEmptyError } from '../utils/errors';
import { MANAGER_PERM } from '../utils/auth';
import { getCardService } from './cardService';
import { activeConfig } from '../config';
export const USER_INDEX = 'users';
export const USER_TYPE = 'user';

let auth0ManagementToken = null;
let tokenType = null;

const AUTH0_DOMAIN = activeConfig.auth.domain;
const MANAGEMENT_URL = AUTH0_DOMAIN + '/api/v2/';

const autoSetAuth0ManagementToken = async () => {
  try {
    const authRes = await fetch(AUTH0_DOMAIN + '/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: activeConfig.auth.clientId,
        client_secret: activeConfig.auth.AUTH_CLIENT_SECRET,
        audience: MANAGEMENT_URL,
        grant_type: 'client_credentials',
      }),
    });

    if (!authRes.ok) throw(new Error(`auth0 server auth failed, ${JSON.stringify(await authRes.json())}`));      

    const {access_token, expires_in: expirationInSeconds, token_type} = await authRes.json();

    auth0ManagementToken = access_token;
    tokenType = token_type;
    setTimeout(autoSetAuth0ManagementToken, expirationInSeconds * 1000);
  } catch (e) {
    console.error('could not request new token from auth0', e);
  }
}

autoSetAuth0ManagementToken();

const waitForNewAuth0ManagementToken = () => {
  const currToken = auth0ManagementToken;
  const timeoutCount = 5;
  let count = 0;

  return new Promise((resolve, reject) => {
    const poll = setInterval(() => {
      if (currToken !== auth0ManagementToken) {
        clearInterval(poll);
        resolve();
      }

      if (++count === timeoutCount) {
        clearInterval(poll);
        reject('timeout');
      }
    }, 1000)
  });
}

//*1000 because exp is in seconds and Date.now() is in miliseconds
const isTokenValid = () => auth0ManagementToken && jwtUtil.decode(auth0ManagementToken).exp * 1000 > Date.now();

const getAuth0ManagementToken = () => new Promise (async (resolve, reject) => {
  if (isTokenValid()) {
    resolve(auth0ManagementToken)
    return;
  }

  try {
    await waitForNewAuth0ManagementToken();
    resolve(auth0ManagementToken);
  } catch (e) {
    reject(e);
  }
});

const getAuth0Header = async () => {
  const token = await getAuth0ManagementToken();
  return {
    authorization: tokenType + ' ' + token,
    'Content-Type': 'application/json',
  }
}

/**
 * @param  {} signedInUser
 * @param  {} updateScript
 * @param  {} params
 * @param  {} upsert
 */
const getUserQueryOptions = (signedInUser, updateScript, params, upsert) => {
  if (!signedInUser) return null;

  return {
    index: USER_INDEX,
    type: USER_TYPE,
    id: signedInUser._id,
    body: {
      script: {
        source: updateScript,
        params: {
          signedInUserId: (signedInUser || {})._id,
          ...params
        },
      },
      upsert,
    }
  }
}

class UserService {
  constructor(elastic) {
    this.elastic = elastic;
  }

  async addUserFlicks(signedInUser, urls) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);
    
    const createdDate = Date.now();
    const flicks = urls.map(url => {
      if (!url) throw new Error(getCannotBeEmptyError('Url'));
      return {
        flick: url,
        createdDate
      }
    });

    const res = await this.elastic.update(getUserQueryOptions(
      signedInUser,
      'ctx._source.flicks.addAll(params.flicks)',
      { flicks },
      { flicks }
    ));

    return res.result === 'updated';
  }

  async doesUserExist(email) {
    try {
      const users = await this.getUsersByEmail(email);
      if (users.length === 1) return true;
      if (users.length === 0) return false;
    } catch (e) {
      console.error(e);
      throw new Error(`Internal server error. Could not verify if email already exists in FoodFlick.`);
    }
  }

  async getMyCard(signedInUser) {
    if (!signedInUser) throw new Error(NEEDS_SIGN_IN_ERROR);
    return await getCardService().getUserCard(signedInUser.stripeId);
  }

  async getMyFlicks(signedInUser) {
    if (!signedInUser.perms.includes(MANAGER_PERM)) throw new Error(NEEDS_MANAGER_SIGN_IN_ERROR);

    try {
      const res = await this.elastic.get({
        index: USER_INDEX,
        type: USER_TYPE,
        id: signedInUser._id,
        _sourceInclude: [ 'flicks.flick' ], // only include the flick property within the array of flick (flicks) objects
      });
      return res._source.flicks;
    } catch (e) { // happens when doc doesn't exist in user index, which happens if user never uploaded anythign
      console.error('error', e);
      if (e.body.found === false) return [];
      throw new Error('Internal error');
    }
  }

  async getUsersByEmail (email) {
    const res = await fetch(MANAGEMENT_URL + 'users-by-email?email=' + email, {
      headers: await getAuth0Header()
    })

    const jsonData = await res.json();
    
    if (!res.ok) throw(jsonData);      
    return jsonData;
  }

  async getUserById (id, fields) {
    const params = fields ? `?fields=${fields}` : ''
    const res = await fetch(MANAGEMENT_URL + 'users/' + id + params, {
      headers: await getAuth0Header(),
    });

    const jsonData = await res.json();

    if (!res.ok) throw(jsonData);    
    return jsonData;
  }

  async updateCard (signedInUser, cardToken) {
    if (!signedInUser) throw new Error(NEEDS_SIGN_IN_ERROR);
    if (!cardToken) throw new Error(getCannotBeEmptyError('Card token'));
    try {
      const hiddenCard = await getCardService().updateUserCard(signedInUser.stripeId, cardToken);
      fetch(MANAGEMENT_URL + 'users/' + signedInUser._id, {
        headers: await getAuth0Header(),
        method: 'PATCH',
        body: JSON.stringify({
          app_metadata: {
            card: hiddenCard,
          },
        })
      }).catch(e => console.error(e));
      return hiddenCard;
    } catch (e) {
      console.error(e);
      throw new Error(`Internal server error. Could not update card`);
    }
  }

  async updateEmail (signedInUser, newEmail) {
    if (!signedInUser) throw new Error(NEEDS_SIGN_IN_ERROR);
    if (!newEmail) throw new Error(getCannotBeEmptyError('Email'));
    const regex = /\S+@\S+\.\S+/; // simple regex to cover majority of cases
    if(!regex.test(newEmail)) throw new Error('Invalid email. Please enter an email like example@example.com');

    const res = await fetch(MANAGEMENT_URL + 'users/' + signedInUser._id, {
      headers: await getAuth0Header(),
      method: 'PATCH',
      body: JSON.stringify({
        email: newEmail
      })
    });

    const jsonData = await res.json();

    if (!res.ok) throw(jsonData);    
    return jsonData;
  }
}

let userService;

export const getUserService = elastic => {
  if (userService) return userService;
  userService = new UserService(elastic);
  return userService;
};