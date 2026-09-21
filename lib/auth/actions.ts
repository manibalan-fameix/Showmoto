"use server"

import { signIn, signOut } from "./index"

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" })
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" })
}
