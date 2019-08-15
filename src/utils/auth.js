import jwtUtil from 'jsonwebtoken';
import { activeConfig } from '../config';

const PUBLIC_KEY = activeConfig.auth.publicKey;
const issuer = `${activeConfig.auth.domain}/`;
const audience = activeConfig.auth.audience;

export const MANAGER_PERM = 'write:rests';

export const getSignedInUser = req => {
  const ip = req.headers['x-forwarded-for'];
  const authorization = req.headers.authorization;
  if (!authorization || authorization === 'undefined') {
    return null;
  }

  let user = null;
  const namespace = 'https://foodflick.com/';
  const jwt = authorization.replace('Bearer ', '');
  try {
    //throws error is verification fails
    const claims = jwtUtil.verify(jwt, PUBLIC_KEY, {
      algorithms: ['RS256'],
      issuer,
      audience,
    });
    user = {
      //remove identity provider because auth0 id does't include it
      _id: claims.sub,
      name: claims[namespace + 'firstName'] + ' ' + claims[namespace + 'lastName'],
      ip,
      email: claims[namespace + 'email'],
      stripeId: claims[namespace + 'stripeId'],
      perms: claims.scope.includes(MANAGER_PERM) ? [MANAGER_PERM] : []
    }
  
  } catch (e) {
    //todo 1: error handle
    console.error('BAD TOKEN', e, jwt);
    throw e;
  }

  return user;
}