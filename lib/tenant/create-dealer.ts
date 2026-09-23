import { unscopedDb } from "../db/client"
import { dealerUsers, dealers } from "../db/schema"
import type { OnboardInput } from "../dealers/onboard"
import { DEFAULT_THEME } from "../theme/tokens"

/** Creates a dealership and makes `userId` its owner. Throws with Postgres code 23505 if the slug is taken. */
export async function createDealerForOwner(userId: string, input: OnboardInput): Promise<void> {
  await unscopedDb.transaction(async (tx) => {
    const [dealer] = await tx
      .insert(dealers)
      .values({ ...input, theme: DEFAULT_THEME, plan: "starter" })
      .returning({ id: dealers.id })
    await tx.insert(dealerUsers).values({ dealerId: dealer.id, userId, role: "owner" })
  })
}
