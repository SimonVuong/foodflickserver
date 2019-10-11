import { Store } from 'redux';
import { activeConfig } from './config';
import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { onError } from 'apollo-link-error';
import { InMemoryCache, NormalizedCacheObject  } from 'apollo-cache-inmemory';
import { RootState, RootActions } from 'general/redux/rootReducer';

let apolloClient: ApolloClient<NormalizedCacheObject>;
const getApolloClient = (store?: Store<RootState, RootActions>) => {
  if (apolloClient) return apolloClient;
  const httpLink = new HttpLink({uri: `${activeConfig.app.apiUrl}/graphql`})
  const errorLink = onError(e => {
    const { graphQLErrors, networkError, operation } = e;
    const { variables, operationName } = operation;
    let msg = '';
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, path }) => {
        msg = msg + '\n' +`[GraphQL error]: Message: '${message}', Path: '${path}', variables: '${JSON.stringify(variables)}'`
      });
    }

    if (networkError) {
      msg = `[Network error]: '${networkError}', Operation: '${operationName}', variables: '${JSON.stringify(variables)}`;
    }

    console.error(JSON.stringify(e));
    // throw error for LogRocket to capture
    throw new Error(msg);
  });

  const authLink = setContext((_, { headers }) => {
    const signedInUser = store!.getState().Account.SignedInUser;
    //undefined, otherwise server will receive a 'null' authorization header which is wrong
    const authorization = signedInUser ? signedInUser.AccessToken.HeaderString : undefined;
    return {
      headers: {
        ...headers,
        authorization:authorization
      }
    }
  });

  const link = ApolloLink.from([
    authLink,
    errorLink,
    httpLink,
  ]);
  
  apolloClient =  new ApolloClient({
    link,
    cache: new InMemoryCache({
      //why? see https://stackoverflow.com/questions/48840223/apollo-duplicates-first-result-to-every-node-in-array-of-edges/49249163#49249163
      dataIdFromObject: (o: any) => (o._id ? `${o.__typename}:${o._id}`: null),
    }),
  });

  return apolloClient;
}

export { getApolloClient };
