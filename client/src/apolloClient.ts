import { notificationErrorAction } from './general/redux/ui/notification/notificationActions';
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
    console.log(JSON.stringify(e));
    // todo 0: handle all apollo errors here
    const { graphQLErrors, networkError } = e;
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) => {
        console.warn(
          `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`,
        );
      });
    }

    if (networkError) {
      console.warn(`[Network error]: ${networkError}`);
    }
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
