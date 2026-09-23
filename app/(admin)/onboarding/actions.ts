"use server"

import { getDealerContext } from "@/lib/auth/context"
import { onboardSchema, slugSchema } from "@/lib/dealers/onboard"
import { tenantUrl } from "@/lib/env"
import { allow } from "@/lib/rate-limit"
import { createDealerForOwner, isSlugTaken } from "@/lib/tenant/create-dealer"

export type SlugStatus = "available" | "taken" | "invalid" | "limited"

/** Live "is this web address free?" check. Signed-in users only, and rate limited. */
export async function checkSlug(raw: string): Promise<SlugStatus> {
  const ctx = await getDealerContext()
  if (ctx.status !== "no-dealer") return "invalid"
  if (!allow(`slug:${ctx.user.id}`, 60, 60_000)) return "limited"
  const parsed = slugSchema.safeParse(raw)
  if (!parsed.success) return "invalid"
  return (await isSlugTaken(parsed.data)) ? "taken" : "available"
}

export type CreateResult =
  | { ok: true; url: string }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> }

export async function createDealership(draft: unknown): Promise<CreateResult> {
  const ctx = await getDealerContext()
  if (ctx.status !== "no-dealer") return { ok: false, error: "Please sign in again." }
  if (!allow(`onboard:${ctx.user.id}`, 5, 10 * 60_000)) return { ok: false, error: "Too many attempts. Try again in a few minutes." }

  const parsed = onboardSchema.safeParse(draft)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message
    return { ok: false, fieldErrors }
  }

  try {
    // The dealer id is never taken from the request: the new dealer is linked to the signed-in user only.
    await createDealerForOwner(ctx.user.id, parsed.data)
  } catch (error) {
    const code = (error as { code?: string; cause?: { code?: string } }).cause?.code ?? (error as { code?: string }).code
    if (code === "23505") return { ok: false, fieldErrors: { slug: "That web address was just taken. Try another." } }
    console.error("create dealership failed")
    return { ok: false, error: "Something went wrong. Please try again." }
  }
  return { ok: true, url: tenantUrl(parsed.data.slug) }
}
