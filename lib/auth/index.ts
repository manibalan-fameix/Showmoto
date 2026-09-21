import { DrizzleAdapter } from "@auth/drizzle-adapter"
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

import { unscopedDb } from "../db/client"
import { accounts, users } from "../db/schema"

// Keys come from env: AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET.
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(unscopedDb, { usersTable: users, accountsTable: accounts }),
  session: { strategy: "jwt" },
  // Host is validated by proxy.ts: only app.<ROOT_DOMAIN> can reach /api/auth.
  trustHost: true,
  providers: [
    // Google verifies email ownership, so linking by email is safe. It lets an owner
    // pre-create a staff invite by email and have it attach on first sign-in.
    Google({ allowDangerousEmailAccountLinking: true }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    },
  },
})

export const isAuthConfigured = () =>
  Boolean(process.env.AUTH_SECRET && process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)
