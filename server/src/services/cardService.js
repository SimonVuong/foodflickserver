const getCustomerDefaultCard = stripeCustomer => {
  const defaultSourceId = stripeCustomer.default_source;
  return stripeCustomer.sources.data.find(card => card.id === defaultSourceId);
}

const getCustomerDefaultCardData = stripeCustomer => {
  const card = getCustomerDefaultCard(stripeCustomer);
  if (!card) return null;
  return getHiddenCard(card);
}

const getHiddenCard = card => {
  const { id, last4, exp_month, exp_year } = card;
  return {
    cardTok: id,
    last4,
    expMonth: exp_month,
    expYear: exp_year,
  };
}

class CardService {
  constructor(stripe) {
    this.stripe = stripe;
  }

  getCardId = async stripeCustomerId => {
    const res = await this.stripe.customers.retrieve(stripeCustomerId);
    if (res.error) throw res.error;
    const card = getCustomerDefaultCard(res);
    if (!card) return null;
    return card.id
  }

  getUserCard = async stripeCustomerId => {
    const res = await this.stripe.customers.retrieve(stripeCustomerId);
    if (res.error) throw res.error;
    return getCustomerDefaultCardData(res);
  }

  getCustomerCardById = async (stripeCustomerId, cardTok) => {
    try {
      const card = await this.stripe.customers.retrieveSource(stripeCustomerId, cardTok);
      return getHiddenCard(card);
    } catch(e) {
      console.error(e);
      return null;
    }
  }

  addUserCard = async (stripeCustomerId, cardToken) => {
    const res = await this.stripe.customers.createSource(
      stripeCustomerId,
      { source: cardToken }
    );
    if (res.error) throw res.error;
    return getHiddenCard(res);
  }

  // update a user's default source
  updateUserCard = async (stripeCustomerId, cardToken) => {
    const newCard = await this.addUserCard(stripeCustomerId, cardToken);
    const res = await this.stripe.customers.update(
      stripeCustomerId,
      { default_source: newCard.cardTok }
    );
    if (res.error) throw res.error;
    return getCustomerDefaultCardData(res);
  }
}

let cardService;

export const getCardService = stripe => {
  if (cardService) return cardService;
  cardService = new CardService(stripe);
  return cardService;
};
