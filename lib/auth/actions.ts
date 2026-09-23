"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"
import { z } from "zod"

import { signIn, signOut } from "./index"
import { DEV_BYPASS_COOKIE, isDevBypassEnabled } from "./dev-bypass"
import {
  LOCAL_LOGIN_COOKIE,
  ensureLocalDealerUser,
  isLocalPasswordLoginEnabled,
  localLoginCookieValue,
  localLoginPassword,
} from "./local-login"

export type EmailPasswordLoginState = { error?: string }

const emailPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
})

export type FirebaseSignInResult = { ok: true } | { ok: false; error: string }

/** Exchanges a Firebase ID token (from the browser SDK) for an app session. */
export async function signInWithFirebaseToken(idToken: string): Promise<FirebaseSignInResult> {
  try {
    await signIn("firebase", { idToken, redirect: false })
    return { ok: true }
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "We could not verify your sign-in. If you used email, confirm your email address first." }
    }
    throw error
  }
}

/** Dev only: open the in-memory demo dealer when Firebase is not configured. */
export async function openDevDemo() {
  if (!isDevBypassEnabled()) redirect("/login")
  ;(await cookies()).set(DEV_BYPASS_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/" })
  redirect("/dashboard")
}

export async function signInWithEmailPassword(
  _state: EmailPasswordLoginState,
  formData: FormData,
): Promise<EmailPasswordLoginState> {
  if (!isLocalPasswordLoginEnabled()) return { error: "Email login is only available in development." }

  const parsed = emailPasswordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) return { error: "Enter a valid email and password." }

  if (parsed.data.password !== localLoginPassword()) return { error: "Incorrect password." }

  try {
    await ensureLocalDealerUser(parsed.data.email)
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not prepare the local dealer account." }
  }

  const cookieStore = await cookies()
  cookieStore.delete(DEV_BYPASS_COOKIE)
  cookieStore.set(LOCAL_LOGIN_COOKIE, localLoginCookieValue(parsed.data.email), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  })
  redirect("/dashboard")
}

export async function signOutAction() {
  const cookieStore = await cookies()
  cookieStore.delete(DEV_BYPASS_COOKIE)
  cookieStore.delete(LOCAL_LOGIN_COOKIE)
  await signOut({ redirectTo: "/login" })
}
