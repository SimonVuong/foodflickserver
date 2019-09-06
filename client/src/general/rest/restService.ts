import { selectOrderingRestAction } from 'general/rest/redux/restActions';
import gql from 'graphql-tag';
import { customerRestFragment } from 'general/rest/restFragments';
import { getApolloClient } from 'apolloClient';
import { ICustomerRest, CustomerRest } from 'general/rest/models/CustomerRestModel';
import { useLazyQuery } from '@apollo/react-hooks';
import { useEffect, useMemo } from 'react';
import { getStore } from 'general/redux/store';
import { QueryResult } from '@apollo/react-common';

abstract class RestService {
  static getRestSearchSuggestions(query: string) {
    type getRestSearchSuggestionsRes = {
      restSearchSuggestions: ICustomerRest[]
    }
    const res = getApolloClient().query<getRestSearchSuggestionsRes>({
      query: gql`
        query restSearchSuggestions($query: String!) {
          restSearchSuggestions(query: $query) {
            ...customerRestFragment
          }
        }
        ${customerRestFragment}
      `,
      variables: { query },
    });
    return res.then(({ data }) => data.restSearchSuggestions.map(rest => new CustomerRest(rest)));
  }
}

const useGetRestByUrlQuery = (): [
  (url: string) => void,
  { data: CustomerRest | undefined } & QueryResult<any, Record<string, any>>
] => {
  type res = {
    restByUrl: ICustomerRest
  }
  const [query, queryRes] = useLazyQuery<res>(gql`
    query restByUrl($url: String!) {
      restByUrl(url: $url) {
        ...customerRestFragment
      }
    }
    ${customerRestFragment}
  `);
  const rest = useMemo(() => (
    queryRes.data && queryRes.data.restByUrl ? new CustomerRest(queryRes.data.restByUrl) : undefined
  ), [queryRes.data]);

  useEffect(() => {
    if (rest) getStore().dispatch(selectOrderingRestAction(rest));
  }, [rest]);

  return [
    (url: string) => query({ variables: { url }}),
    {
      ...queryRes,
      data: rest
    }
  ]
}

export {
  RestService,
  useGetRestByUrlQuery,
}
