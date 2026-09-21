// Import or update the variants master table from CSV. Re-running is safe: rows upsert on their natural key.
// Run: pnpm db:import-variants [path/to/file.csv] [--dry]
import { readFileSync } from "node:fs"

import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import { variants } from "../lib/db/schema/variants.ts"
import { parseVariantCsv } from "../lib/variants/import.ts"

const args = process.argv.slice(2)
const dry = args.includes("--dry")
const file = args.find((a) => !a.startsWith("--")) ?? "data/variants/chennai-top40.csv"

const { variants: rows, errors } = parseVariantCsv(readFileSync(file, "utf8"))
if (errors.length) {
  for (const e of errors) console.error(`${file}:${e.line}  ${e.message}`)
  console.error(`\n${errors.length} problem(s). Nothing was imported.`)
  process.exit(1)
}
const models = new Set(rows.map((r) => `${r.make}|${r.model}`))
console.log(`${file}: ${rows.length} variants across ${models.size} models`)
if (dry) process.exit(0)

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set")
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool)
try {
  for (let i = 0; i < rows.length; i += 200) {
    await db
      .insert(variants)
      .values(rows.slice(i, i + 200))
      .onConflictDoUpdate({
        target: [variants.make, variants.model, variants.variant, variants.fuel, variants.transmission, variants.yearFrom],
        set: {
          engineCc: sql`excluded.engine_cc`,
          yearTo: sql`excluded.year_to`,
          specs: sql`excluded.specs`,
          features: sql`excluded.features`,
        },
      })
  }
  console.log("done")
} finally {
  await pool.end()
}
