"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type EmailPasswordLoginState, signInWithEmailPassword } from "@/lib/auth/actions"

const initialState: EmailPasswordLoginState = {}

export function EmailPasswordForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, formAction, pending] = useActionState(signInWithEmailPassword, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={defaultEmail} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  )
}
