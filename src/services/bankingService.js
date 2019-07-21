class BankingService {
  constructor(stripe) {
    this.stripe = stripe;
  }

  getStripeRestAccount = stripeId => this.stripe.accounts.retrieve(stripeId);

  signupRestBanking = (restId, accountNumber, routingNumber) => {
    const options = {
      type: 'custom',
      business_name: restId,
      requested_capabilities: ['platform_payments'],
    };
    if (accountNumber && routingNumber) {
      options.external_account = {
        object: 'bank_account',
        country: 'US',
        currency: 'USD',
        account_holder_type: 'company',
        account_number: accountNumber,
        routing_number: routingNumber,
      };
    }
    return this.stripe.accounts.create(options);
  }

  updateRestBanking = (stripeId, accountNumber, routingNumber) => this.stripe.accounts.update(stripeId, {
    external_account: {
      object: 'bank_account',
      country: 'US',
      currency: 'USD',
      account_holder_type: 'company',
      account_number: accountNumber,
      routing_number: routingNumber
    },
  });
}

let bankingService;

export const getBankingService = stripe => {
  if (bankingService) return bankingService;
  bankingService = new BankingService(stripe);
  return bankingService;
};