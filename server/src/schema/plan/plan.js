export const PlanNames = {
  Free: 'Free',
  Standard: 'Standard',
  Unlimited: 'Unlimited',
  Custom: 'Custom',
}

const PlanName = `
  enum PlanName {
    Free
    Standard
    Unlimited
    Custom
  }
`

const _Plan = `
  type Plan {
    stripePlanId: ID!
    name: PlanName!
    monthlyOrders: Int!
    monthlyRate: Float!
    overagePercentageFee: Float!
  }
`

export const Plan = () => [_Plan, PlanName];