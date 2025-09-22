// Centralized pricing configuration for marketing and billing reuse
export type PricingPlan = {
  id: 'basic' | 'pro';
  name: string;
  priceMonthly: number;
  stripePriceIdMonthly: string;
  features: string[];
  isPopular?: boolean;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'basic',
    name: 'Basic Pro Plan',
    priceMonthly: 29,
    // TODO: replace with real Stripe price ID for monthly basic plan
    stripePriceIdMonthly: 'price_1S9nHfDsk4ejV7WU1O956dlX',
    features: ['Up to 500 students', 'Unlimited rooms', '300 Visitor logs', '1000 Complaints Supported', '5 Wardens', '20 Staff Members', '5 Max Hostels'],
    isPopular: true,
  },
  {
    id: 'pro',
    name: 'Enterprise Plan',
    priceMonthly: 99,
    // TODO: replace with real Stripe price ID for monthly pro/enterprise plan
    stripePriceIdMonthly: 'price_1S9nLtDsk4ejV7WU0u9tJ5l9',
    features: ['Unlimited everything', 'Priority support', 'Online Payment Integration for Students to Pay dues'],
  },
];
