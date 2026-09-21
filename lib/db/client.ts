import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "./schema"

const globalForDb = globalThis as unknown as { __pool?: Pool }

function createPool() {
  // Lazy connection: constructing a Pool never connects, so importing this
  // module (build, tests, SQL generation) works without a database.
  return new Pool({ connectionString: process.env.DATABASE_URL, max: 10 })
}

const pool = (globalForDb.__pool ??= createPool())

/**
 * RAW, UNSCOPED database handle. Tenant and admin code must NOT import this:
 * ESLint blocks it outside lib/db, lib/auth, lib/tenant, scripts and tests.
 * Use `scopedDb(dealerId)` from "@/lib/db/scoped" instead.
 */
export const unscopedDb = drizzle(pool, { schema })
export type Db = typeof unscopedDb
export { pool }
