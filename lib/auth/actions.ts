"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { signIn, signOut } from "./index"
import { DEV_BYPASS_COOKIE, isDevBypassEnabled } from "./dev-bypass"

export async function signInWithGoogle() {
  if (isDevBypassEnabled()) {
    ;(await cookies()).set(DEV_BYPASS_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/" })
    redirect("/dashboard")
  }
  await signIn("google", { redirectTo: "/dashboard" })
}

export async function signOutAction() {
  ;(await cookies()).delete(DEV_BYPASS_COOKIE)
  await signOut({ redirectTo: "/login" })
}
