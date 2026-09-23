import Link from "next/link"
import { redirect } from "next/navigation"

import { FirebaseLogin } from "@/components/auth/firebase-login"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { copy } from "@/lib/copy"
import { auth, isAuthConfigured } from "@/lib/auth"
import { openDevDemo } from "@/lib/auth/actions"
import { isDevBypassEnabled } from "@/lib/auth/dev-bypass"
import { getFirebaseWebConfig } from "@/lib/auth/firebase"
import { defaultLocalLoginEmail, isLocalPasswordLoginEnabled } from "@/lib/auth/local-login"
import { EmailPasswordForm } from "./email-password-form"

export const metadata = { title: copy.auth.signInTitle }
// Reads env and session at request time; never prerender.
export const dynamic = "force-dynamic"

export default async function LoginPage() {
  const configured = isAuthConfigured()
  const firebaseConfig = getFirebaseWebConfig()
  const bypass = isDevBypassEnabled()
  const localPassword = isLocalPasswordLoginEnabled()
  if (configured && (await auth())?.user) redirect("/dashboard")

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{copy.auth.signInTitle}</CardTitle>
          <CardDescription>{copy.auth.signInBody}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {localPassword ? <EmailPasswordForm defaultEmail={defaultLocalLoginEmail()} /> : null}
          {configured && firebaseConfig ? <FirebaseLogin config={firebaseConfig} /> : null}
          {bypass ? (
            <form action={openDevDemo}>
              <Button type="submit" size="lg" variant="outline" className="w-full">
                Open the demo dealer
              </Button>
            </form>
          ) : null}
          {bypass ? (
            <p className="text-sm text-muted-foreground">{copy.auth.devBypass}</p>
          ) : (
            !configured && <p className="text-sm text-muted-foreground">{copy.auth.notConfigured}</p>
          )}
          <p className="text-xs text-muted-foreground">
            By continuing you agree to our <Link className="underline" href="/terms">Terms</Link> and <Link className="underline" href="/privacy">Privacy Policy</Link>.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
