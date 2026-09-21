import { unscopedDb } from "../db/client"
import { variants } from "../db/schema"
import type { VariantRow } from "./match"

// The variants table is shared master data, not tenant data, so it is read directly.
// It is small (hundreds of rows) and read-mostly: keep a short-lived copy per server instance.
let cache: { rows: VariantRow[]; at: number } | null = null
const TTL_MS = 5 * 60_000

export async function getAllVariants(): Promise<VariantRow[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rows
  const rows = await unscopedDb
    .select({
      id: variants.id, make: variants.make, model: variants.model, variant: variants.variant,
      fuel: variants.fuel, transmission: variants.transmission, engineCc: variants.engineCc,
      yearFrom: variants.yearFrom, yearTo: variants.yearTo,
    })
    .from(variants)
  cache = { rows, at: Date.now() }
  return rows
}
