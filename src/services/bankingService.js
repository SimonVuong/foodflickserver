class BankingService {
  constructor(stripe) {
    this.stripe = stripe;
  }

  getStripeRestAccount = stripeId => this.stripe.accounts.retrieve(stripeId);

  // in local dev, there is no ip
  signupRestBanking = (restName, ip = '127.0.0.1', accountNumber, routingNumber) => {
    const options = {
      type: 'custom',
      business_profile: {
        product_description: restName,
      },
      business_type: 'company',
      company: {
        name: restName,
      },
      requested_capabilities: ['platform_payments'],
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip,
      },
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