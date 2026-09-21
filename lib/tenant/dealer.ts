import { and, eq, inArray, isNotNull } from "drizzle-orm"
import { cache } from "react"

import { unscopedDb } from "../db/client"
import { cars, dealerDomains, dealers } from "../db/schema"
import { getPlan } from "../plans"
import { DEFAULT_THEME, dealerThemeSchema, type DealerTheme } from "../theme/tokens"

export type DealerProfile = Omit<typeof dealers.$inferSelect, "theme"> & {
  theme: DealerTheme
  whiteLabel: boolean
}

function toProfile(row: typeof dealers.$inferSelect): DealerProfile {
  const parsed = dealerThemeSchema.safeParse(row.theme)
  return { ...row, theme: parsed.success ? parsed.data : DEFAULT_THEME, whiteLabel: getPlan(row.plan).whiteLabel }
}

/** The dealers table is the tenant root, so it is looked up by slug, not scoped by dealer_id. */
export const getDealerBySlug = cache(async (slug: string): Promise<DealerProfile | null> => {
  const [row] = await unscopedDb.select().from(dealers).where(eq(dealers.slug, slug)).limit(1)
  return row ? toProfile(row) : null
})

// ---- Custom domains (paid tier) ----
// Lookup only. Provisioning via Cloudflare for SaaS is a stub.
// TODO: provision hostnames and certificates through Cloudflare for SaaS and set verified_at
// from the webhook. Until then, a row needs verified_at set by hand.

type Entry = { slug: string | null; expires: number }
const CACHE_TTL_MS = 60_000
const NEGATIVE_TTL_MS = 15_000
const domainCache = new Map<string, Entry>()

/** Resolve a verified custom hostname to a dealer slug. Cached: the proxy runs on every request. */
export async function resolveCustomDomain(hostname: string): Promise<string | null> {
  const hit = domainCache.get(hostname)
  if (hit && hit.expires > Date.now()) return hit.slug

  const [row] = await unscopedDb
    .select({ slug: dealers.slug, plan: dealers.plan })
    .from(dealerDomains)
    .innerJoin(dealers, eq(dealers.id, dealerDomains.dealerId))
    .where(and(eq(dealerDomains.hostname, hostname), isNotNull(dealerDomains.verifiedAt)))
    .limit(1)

  const slug = row && getPlan(row.plan).customDomain ? row.slug : null
  if (domainCache.size > 5000) domainCache.clear()
  domainCache.set(hostname, { slug, expires: Date.now() + (slug ? CACHE_TTL_MS : NEGATIVE_TTL_MS) })
  return slug
}

/**
 * Short code -> canonical slug, for this dealer's own cars only. The dealer filter is what stops
 * one dealer's short link from ever resolving to another dealer's car. Drafts and archived cars
 * do not resolve; sold cars still do, so an old link keeps working.
 */
export async function resolveShortCode(dealerSlug: string, code: string): Promise<string | null> {
  const [row] = await unscopedDb
    .select({ slug: cars.slug })
    .from(cars)
    .innerJoin(dealers, eq(dealers.id, cars.dealerId))
    .where(and(eq(dealers.slug, dealerSlug), eq(cars.shortCode, code), inArray(cars.status, ["live", "on_hold", "sold"])))
    .limit(1)
  return row?.slug ?? null
}
