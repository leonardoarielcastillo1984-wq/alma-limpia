/** Planes de membresía (precios en ARS, período 30 días). */
export const MEMBERSHIP_PLANS = {
  LUNA: { priceArs: 19000, title: "Membresía Luna", desc: "Consultas y lecturas ilimitadas" },
  ESTRELLA: { priceArs: 29000, title: "Membresía Estrella", desc: "Todo Luna + tarot semanal" },
  COSMOS: { priceArs: 45000, title: "Membresía Cosmos", desc: "Todo Estrella + carta natal + sinastría" },
} as const;

export type MembershipPlan = keyof typeof MEMBERSHIP_PLANS;
