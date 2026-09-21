import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { cache } from "react"

import { unscopedDb } from "../db/client"
import { dealerUsers, dealers } from "../db/schema"
import { auth } from "./index"
import { DEV_BYPASS_COOKIE, DEV_DEALER, DEV_USER, isDevBypassEnabled } from "./dev-bypass"
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
      /** Dev-only demo session: no database rows exist for it, so do not query by its dealer id. */
      devBypass?: boolean
    }

/**
 * Resolves the signed-in user to their dealer. Everything downstream must use
 * `scopedDb(ctx.dealer.id)`; the dealer id never comes from the request.
 * v1: a user belongs to one dealer; if several exist the earliest link wins.
 */
export const getDealerContext = cache(async (): Promise<DealerContext> => {
  if (isDevBypassEnabled() && (await cookies()).get(DEV_BYPASS_COOKIE)) {
    return { status: "ok", user: DEV_USER, dealer: DEV_DEALER, role: "owner", plan: getPlan(DEV_DEALER.plan), devBypass: true }
  }
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
