import gql from 'graphql-tag';
import { getApolloClient } from 'apolloClient';
import { cardFragment } from 'general/card/cardFragment';
import { Card } from 'general/card/CardModel';

abstract class AccountService {
  static async updateCard(cardToken: string) {
    type res = {
      data: {
        updateUserCard: Card
      },
    }
    const res: res = await getApolloClient().mutate({
      mutation: gql`
        mutation updateUserCard($cardToken: ID!) {
          updateUserCard(cardToken: $cardToken) {
            ...cardFragment
          }
        }
        ${cardFragment}
      `,
      variables: {
        cardToken
      },
      // update: (cache, {data: { updateUserCard }}) => {
      //   //try/catch because if we update card before ever querying my card, then we get error. see
      //   //https://github.com/apollographql/apollo-client/issues/1542
      //   try {
      //     cache.writeQuery({
      //       query: myCardQuery,
      //       data: { myCard: updateUserCard }
      //     });
      //   } catch(e) {}
      // },
    });
    return new Card(res.data.updateUserCard);
  }
}

// const useUpdateCard = () => {
//   type res = {
//     updateUserCard: ICard,
//   };
//   type vars = {
//     cardToken: string,
//   };
//   const [mutate, mutation] = useMutation<res, vars>(gql`
//     mutation updateUserCard($cardToken: ID!) {
//       updateUserCard(cardToken: $cardToken) {
//         ...cardFragment
//       }
//     }
//     ${cardFragment}
//   `);
//   const updateCard = (cardToken: string) => mutate({ variables: { cardToken }})
//   return [updateCard, mutation]
// }

export {
  AccountService,
  // useUpdateCard,
}
