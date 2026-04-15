/**
 * Stripe Products & Prices for Assist-Pró
 * Centralized product definitions for all billing plans.
 */

export const STRIPE_PLANS = {
  monthly: {
    name: "Assist-Pró Mensal",
    description: "Gestão completa de assistências técnicas — cobrança mensal",
    priceLabel: "R$ 99/mês",
    amount: 9900, // centavos
    currency: "brl",
    interval: "month" as const,
    trialDays: 14,
  },
  annual: {
    name: "Assist-Pró Anual",
    description: "Gestão completa de assistências técnicas — cobrança anual",
    priceLabel: "R$ 799/ano",
    amount: 79900,
    currency: "brl",
    interval: "year" as const,
    trialDays: 14,
  },
  lifetime: {
    name: "Assist-Pró Vitalício",
    description: "Gestão completa de assistências técnicas — pagamento único vitalício",
    priceLabel: "R$ 1.499",
    amount: 149900,
    currency: "brl",
    interval: null, // one-time payment
    trialDays: 0,
  },
} as const;

export type PlanKey = keyof typeof STRIPE_PLANS;
