// Stripe product/price configuration
// These IDs come from the Stripe Dashboard

export const STRIPE_PLANS = {
  monthly: {
    product_id: 'prod_U3OntrMsTZWOrg',
    price_id: 'price_1T5Hzh4IbA07mncZ0wu30STv',
    name: 'Premium Mensal',
    price: 'R$ 24,99',
    priceAmount: 2499,
    interval: 'month' as const,
    description: 'Cobrança mensal',
  },
  yearly: {
    product_id: 'prod_U3OotUocmSj8Rm',
    price_id: 'price_1T5I0T4IbA07mncZ1LYasGcl',
    name: 'Premium Anual',
    price: 'R$ 199,90',
    priceAmount: 19990,
    interval: 'year' as const,
    description: 'Economia de R$100 por ano',
    savings: '33% OFF',
  },
} as const;

export type StripePlanKey = keyof typeof STRIPE_PLANS;
