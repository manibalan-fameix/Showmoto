import { redirect } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDealerContext } from "@/lib/auth/context"
import { getRootDomain } from "@/lib/env"

import { OnboardingForm } from "./onboarding-form"

export const metadata = { title: "Set up your showroom" }
export const dynamic = "force-dynamic"

// First sign-in: a new user has no dealership yet. Creating one makes them its owner.
export default async function OnboardingPage() {
  const ctx = await getDealerContext()
  if (ctx.status === "anonymous") redirect("/login")
  if (ctx.status === "ok") redirect("/dashboard")

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set up your showroom</CardTitle>
          <CardDescription>Tell us about your dealership. You can change the look and details later.</CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm rootDomain={getRootDomain() ?? "localhost:3000"} defaultName="" />
        </CardContent>
      </Card>
    </main>
  )
}
