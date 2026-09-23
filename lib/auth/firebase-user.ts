import { and, eq } from "drizzle-orm"

import { unscopedDb } from "../db/client"
import { accounts, users } from "../db/schema"
import type { FirebaseIdentity } from "./firebase"

export type AuthUser = { id: string; name: string | null; email: string | null; image: string | null }

/**
 * Maps a verified Firebase identity to a user row.
 *  1. Known Firebase uid: that user.
 *  2. Verified email matching an existing user (e.g. a former Google sign-in): link to it.
 *  3. Otherwise create a new user. Phone-only sign-ins have no email.
 * An unverified email is never used to link, so nobody can claim someone else's account by typing their address.
 */
export async function findOrCreateFirebaseUser(identity: FirebaseIdentity): Promise<AuthUser | null> {
  const [linked] = await unscopedDb
    .select({ user: users })
    .from(accounts)
    .innerJoin(users, eq(users.id, accounts.userId))
    .where(and(eq(accounts.provider, "firebase"), eq(accounts.providerAccountId, identity.uid)))
    .limit(1)
  if (linked) return toAuthUser(linked.user)

  const email = identity.emailVerified ? identity.email : null
  let user = email ? (await unscopedDb.select().from(users).where(eq(users.email, email)).limit(1))[0] : undefined

  if (!user) {
    ;[user] = await unscopedDb
      .insert(users)
      .values({
        name: identity.name,
        email,
        emailVerified: email ? new Date() : null,
        image: identity.picture,
      })
      .returning()
  }

  await unscopedDb
    .insert(accounts)
    .values({ userId: user.id, type: "oidc", provider: "firebase", providerAccountId: identity.uid })
    .onConflictDoNothing()
  return toAuthUser(user)
}

const toAuthUser = (u: typeof users.$inferSelect): AuthUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  image: u.image,
})
