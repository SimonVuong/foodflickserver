import { QUERY_SIZE, callElasticWithErrorHandler } from './utils';
import { PlanNames } from '../schema/plan/plan';

const DEFAULT_PLAN_NAME = PlanNames.Free;

class PlanService {
  constructor(stripe) {
    this.stripe = stripe;
  }

  async addDefaultPlan(signedInUser) {
    try {
      const activePlans = await this.stripe.plans.list({ limit: 100 });
      const defaultPlan = activePlans.data.find(plan => plan.nickname === DEFAULT_PLAN_NAME);
      const sub = await this.stripe.subscriptions.create({
        customer: signedInUser.stripeId,
        items: [
          {
            plan: defaultPlan.id,
          },
        ]
      });
      return {
        stripeSubscriptionId: sub.id,
        stripePlanId: defaultPlan.id,
        name: DEFAULT_PLAN_NAME,
        monthlyRate: defaultPlan.amount / 100,
        monthlyOrders: defaultPlan.metadata.monthlyOrders,
        overagePercentageFee: defaultPlan.metadata.overagePercentageFee,
      };
    } catch (e) {
      console.error(`[Plan service] failed to add default plan for '${signedInUser._id}'`, e);
      throw e;
    }
  }

  async getSubscription(subscriptionId) {
    // try {
    //   const sub = await callElasticWithErrorHandler(options => this.elastic.getSource(options), {
    //     index: SUBSCRIPTION_INDEX,
    //     type: SUBSCRIPTION_TYPE,
    //     id: subscriptionId,
    //   });
    //   sub._id = subscriptionId;
    //   return sub;
    // } catch (e) {
    //   console.error(`[Subscription service] failed to get subscription for '${subscriptionId}'`, e);
    //   throw e;
    // }
  }

  async getActivePlans(signedInUser, subscriptionId) {
    try {
      const prorationDate = Math.floor(Date.now() / 1000);
      const restSubscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const activePlans = await this.stripe.plans.list({ limit: 100 });

      return activePlans.data.filter(plan => plan.nickname !== PlanNames.Custom).map(async plan => {

        const items = [{
          id: restSubscription.items.data[0].id,
          plan: plan.id, // Switch to new plan
        }];
        const invoice = await this.stripe.invoices.retrieveUpcoming(signedInUser.stripeId, subscriptionId, {
          subscription_items: items,
          subscription_proration_date: prorationDate,
        });

        const proration = invoice.lines.data.reduce((sum, invoiceItem) => 
          invoiceItem.period.start == prorationDate ? sum + invoiceItem.amount : sum
        , 0);
  
        return {
          stripePlanId: plan.id,
          proration: proration / 100,
          name: plan.nickname,
          monthlyRate: plan.amount / 100,
          monthlyOrders: plan.metadata.monthlyOrders,
          overagePercentageFee: plan.metadata.overagePercentageFee,
        }
      });
    } catch (e) {
      console.error(`[Plan service] could not get plans. '${e.message}'`);
      throw e;
    }
  }
}

let planService;

export const getPlanService = (stripe) => {
  if (planService) return planService;
  planService = new PlanService(stripe);
  return planService;
};