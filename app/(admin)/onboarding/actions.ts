"use server"

import { redirect } from "next/navigation"

import { getDealerContext } from "@/lib/auth/context"
import { onboardSchema } from "@/lib/dealers/onboard"
import { createDealerForOwner } from "@/lib/tenant/create-dealer"

export type OnboardState = { error?: string; fieldErrors?: Record<string, string> }

export async function createDealership(_state: OnboardState, formData: FormData): Promise<OnboardState> {
  const ctx = await getDealerContext()
  if (ctx.status === "anonymous") redirect("/login")
  if (ctx.status === "ok") redirect("/dashboard")

  const parsed = onboardSchema.safeParse({
    displayName: formData.get("displayName"),
    slug: formData.get("slug"),
    city: formData.get("city"),
    phone: formData.get("phone"),
  })
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message
    return { fieldErrors }
  }

  try {
    // The dealer id is never taken from the request: the new dealer is linked to the signed-in user only.
    await createDealerForOwner(ctx.user.id, parsed.data)
  } catch (error) {
    const code = (error as { code?: string; cause?: { code?: string } }).cause?.code ?? (error as { code?: string }).code
    if (code === "23505") return { fieldErrors: { slug: "That web address is taken. Try another." } }
    console.error("create dealership failed")
    return { error: "Something went wrong. Please try again." }
  }

  redirect("/dashboard")
}
