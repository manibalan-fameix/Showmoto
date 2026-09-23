import { eq } from "drizzle-orm"
import { cache } from "react"

import { unscopedDb } from "../db/client"
import { dealers } from "../db/schema"
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

export { resolveCustomDomain, resolveShortCode } from "./lookup"
