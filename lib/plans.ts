export const PLAN_KEYS = ["starter", "growth", "pro", "scale"] as const
export type PlanKey = (typeof PLAN_KEYS)[number]

export type PlanConfig = {
  label: string
  /** Maximum cars with status `live` at once. */
  maxLiveCars: number
  whiteLabel: boolean
  customDomain: boolean
}

// No billing in v1: these only drive the live-car cap and feature flags.
export const PLANS: Record<PlanKey, PlanConfig> = {
  starter: { label: "Up to 20 cars", maxLiveCars: 20, whiteLabel: false, customDomain: false },
  growth: { label: "Up to 50 cars", maxLiveCars: 50, whiteLabel: false, customDomain: false },
  pro: { label: "Up to 100 cars", maxLiveCars: 100, whiteLabel: true, customDomain: true },
  scale: { label: "100+ cars", maxLiveCars: 1000, whiteLabel: true, customDomain: true },
}

export function getPlan(key: string): PlanConfig {
  return PLANS[key as PlanKey] ?? PLANS.starter
}
