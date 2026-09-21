import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { copy } from "@/lib/copy"
import { auth, isAuthConfigured } from "@/lib/auth"
import { isDevBypassEnabled } from "@/lib/auth/dev-bypass"
import { signInWithGoogle } from "@/lib/auth/actions"

export const metadata = { title: copy.auth.signInTitle }
// Reads env and session at request time; never prerender.
export const dynamic = "force-dynamic"

export default async function LoginPage() {
  const configured = isAuthConfigured()
  const bypass = isDevBypassEnabled()
  if (configured && (await auth())?.user) redirect("/dashboard")

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{copy.auth.signInTitle}</CardTitle>
          <CardDescription>{copy.auth.signInBody}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form action={signInWithGoogle}>
            <Button type="submit" size="lg" className="w-full" disabled={!configured && !bypass}>
              {copy.auth.signInGoogle}
            </Button>
          </form>
          {bypass ? (
            <p className="text-sm text-muted-foreground">{copy.auth.devBypass}</p>
          ) : (
            !configured && <p className="text-sm text-muted-foreground">{copy.auth.notConfigured}</p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
