import { redirect } from "next/navigation"

import { getDealerContext } from "@/lib/auth/context"
import { getRootDomain } from "@/lib/env"

import { OnboardingWizard } from "./onboarding-wizard"

export const metadata = { title: "Set up your showroom" }
export const dynamic = "force-dynamic"

// First sign-in: a new user has no dealership yet. Creating one makes them its owner.
export default async function OnboardingPage() {
  const ctx = await getDealerContext()
  if (ctx.status === "anonymous") redirect("/login")
  if (ctx.status === "ok") redirect("/dashboard")

  const firstName = ctx.user.name?.trim().split(/\s+/)[0] ?? ""
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <OnboardingWizard rootDomain={getRootDomain() ?? "localhost:3000"} firstName={firstName} />
    </main>
  )
}
