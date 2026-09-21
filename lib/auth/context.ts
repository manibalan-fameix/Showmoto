import { eq } from "drizzle-orm"
import { cache } from "react"

import { unscopedDb } from "../db/client"
import { dealerUsers, dealers } from "../db/schema"
import { auth } from "./index"
import { getPlan } from "../plans"

export type DealerContext =
  | { status: "anonymous" }
  | { status: "no-dealer"; user: { id: string; name?: string | null; email?: string | null } }
  | {
      status: "ok"
      user: { id: string; name?: string | null; email?: string | null }
      dealer: typeof dealers.$inferSelect
      role: "owner" | "staff"
      plan: ReturnType<typeof getPlan>
    }

/**
 * Resolves the signed-in user to their dealer. Everything downstream must use
 * `scopedDb(ctx.dealer.id)`; the dealer id never comes from the request.
 * v1: a user belongs to one dealer; if several exist the earliest link wins.
 */
export const getDealerContext = cache(async (): Promise<DealerContext> => {
  const session = await auth()
  const id = session?.user?.id
  if (!session?.user || !id) return { status: "anonymous" }
  const user = { id, name: session.user.name, email: session.user.email }

  const [row] = await unscopedDb
    .select({ dealer: dealers, role: dealerUsers.role })
    .from(dealerUsers)
    .innerJoin(dealers, eq(dealers.id, dealerUsers.dealerId))
    .where(eq(dealerUsers.userId, user.id))
    .limit(1)

  if (!row) return { status: "no-dealer", user }
  return { status: "ok", user, dealer: row.dealer, role: row.role, plan: getPlan(row.dealer.plan) }
})
