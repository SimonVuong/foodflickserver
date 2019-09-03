const getCard = stripeCustomer => {
  const sources = stripeCustomer.sources;
  if (sources.total_count === 0) return null;
  if (sources.total_count > 1) throw new Error(`Found mulitple cards for ${stripeCustomerId}. Should only have 1.`)
  return sources.data[0];
}

const getCardData = stripeCustomer => {
  const card = getCard(stripeCustomer);
  if (!card) return null;
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
    const card = getCard(res);
    if (!card) return null;
    return card.id
  }

  getUserCard = async stripeCustomerId => {
    const res = await this.stripe.customers.retrieve(stripeCustomerId);
    if (res.error) throw res.error;
    return getCardData(res);
  }
  
  updateUserCard = async (stripeCustomerId, cardToken) => {
    const res = await this.stripe.customers.update(
      stripeCustomerId,
      { source: cardToken }
    );
    if (res.error) throw res.error;
    return getCardData(res);
  }
}

let cardService;

export const getCardService = stripe => {
  if (cardService) return cardService;
  cardService = new CardService(stripe);
  return cardService;
};
