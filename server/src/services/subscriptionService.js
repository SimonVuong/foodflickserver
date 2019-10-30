import { SUBSCRIPTION_INDEX, QUERY_SIZE, callElasticWithErrorHandler, SUBSCRIPTION_TYPE } from './utils';

class SubscriptionService {
  constructor(elastic) {
    this.elastic = elastic;
  }

  async getSubscription(subscriptionId) {
    try {
      const sub = await callElasticWithErrorHandler(options => this.elastic.getSource(options), {
        index: SUBSCRIPTION_INDEX,
        type: SUBSCRIPTION_TYPE,
        id: subscriptionId,
      });
      sub._id = subscriptionId;
      return sub;
    } catch (e) {
      console.error(`[Subscription service] failed to get subscription for '${subscriptionId}'`, e);
      throw e;
    }
  }

  async getAvailableSubscriptions() {
    try {
      const res = await callElasticWithErrorHandler(options => this.elastic.search(options), {
        index: SUBSCRIPTION_INDEX,
        size: QUERY_SIZE,
      });
      return res.hits.hits.map(({ _source, _id }) => {
        _source._id = _id;
        return _source;
      });
    } catch (e) {
      console.error(`[Subscription service] could not get plans. '${e.message}'`);
      throw e;
    }
  }
}

let subscriptionService;

export const getSubscriptionService = elastic => {
  if (subscriptionService) return subscriptionService;
  subscriptionService = new SubscriptionService(elastic);
  return subscriptionService;
};