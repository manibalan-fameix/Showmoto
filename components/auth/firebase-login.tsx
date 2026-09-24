"use client"

import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut as firebaseSignOut,
  type ConfirmationResult,
  type User,
} from "firebase/auth"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { signInWithFirebaseToken } from "@/lib/auth/actions"
import { type FirebaseWebConfig, friendlyAuthError, getFirebaseAuth } from "@/lib/firebase/client"

const RESEND_SECONDS = 30

function Notice({ tone, children }: { tone: "error" | "info"; children: React.ReactNode }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={tone === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
      {children}
    </p>
  )
}

/**
 * `testPhones` (development only) are numbers registered under Firebase > Authentication > Phone > "Phone numbers for
 * testing". For those, app verification is switched off so no reCAPTCHA, SMS or throttling is involved.
 */
export function FirebaseLogin({ config, testPhones = [] }: { config: FirebaseWebConfig; testPhones?: string[] }) {
  const router = useRouter()
  const auth = getFirebaseAuth(config)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const reset = () => {
    setError(null)
    setInfo(null)
  }

  /** Firebase user -> ID token -> app session, then on to the dashboard (which routes new users to onboarding). */
  async function finish(user: User) {
    const result = await signInWithFirebaseToken(await user.getIdToken())
    await firebaseSignOut(auth) // the app session is the source of truth from here on
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.replace("/dashboard")
    router.refresh()
  }

  async function run(fn: () => Promise<void>) {
    reset()
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      setError(friendlyAuthError(e))
    } finally {
      setBusy(false)
    }
  }

  // ---- Google ----
  const google = () => run(async () => finish((await signInWithPopup(auth, new GoogleAuthProvider())).user))

  // ---- Phone ----
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const verifier = useRef<RecaptchaVerifier | null>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // reCAPTCHA refuses to render twice into one element, so every attempt gets a fresh one.
  const resetRecaptcha = () => {
    verifier.current?.clear()
    verifier.current = null
    document.getElementById("recaptcha-container")?.replaceChildren()
  }
  useEffect(() => resetRecaptcha, [])

  const sendCode = () =>
    run(async () => {
      if (!/^[6-9][0-9]{9}$/.test(phone)) throw { code: "auth/invalid-phone-number" }
      auth.settings.appVerificationDisabledForTesting = testPhones.includes(phone)
      resetRecaptcha()
      const host = document.createElement("div")
      document.getElementById("recaptcha-container")?.appendChild(host)
      verifier.current = new RecaptchaVerifier(auth, host, { size: "invisible" })
      try {
        setConfirmation(await signInWithPhoneNumber(auth, `+91${phone}`, verifier.current))
      } catch (e) {
        resetRecaptcha() // a verifier cannot be reused after a failed attempt
        throw e
      }
      setCode("")
      setCooldown(RESEND_SECONDS)
      setInfo(`We sent a 6-digit code to +91 ${phone}.`)
    })

  const verifyCode = (value = code) =>
    run(async () => {
      if (!confirmation || value.length !== 6) return
      await finish((await confirmation.confirm(value)).user)
    })

  // ---- Email + password ----
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault()
    return run(async () => {
      if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email)
        setInfo("If an account exists for that email, a reset link is on its way.")
        return
      }
      if (mode === "signup") {
        if (password.length < 8) throw { code: "auth/weak-password" }
        const { user } = await createUserWithEmailAndPassword(auth, email, password)
        await sendEmailVerification(user)
        await firebaseSignOut(auth)
        setMode("signin")
        setPassword("")
        setInfo("Account created. We sent a link to confirm your email. Open it, then sign in here.")
        return
      }
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      if (!user.emailVerified) {
        await sendEmailVerification(user)
        await firebaseSignOut(auth)
        setInfo("Please confirm your email first. We just sent you a new link.")
        return
      }
      await finish(user)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="phone" onValueChange={reset}>
        <TabsList className="w-full">
          <TabsTrigger value="phone">Phone</TabsTrigger>
          <TabsTrigger value="google">Google</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>

        <TabsContent value="phone" className="flex flex-col gap-3 pt-3">
          {!confirmation ? (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                sendCode()
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="phone">Mobile number</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">+91</span>
                  <Input
                    id="phone"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>
              <Button type="submit" size="lg" disabled={busy || phone.length !== 10}>
                {busy ? "Sending..." : "Send code"}
              </Button>
            </form>
          ) : (
            <div className="flex flex-col gap-3">
              <Label htmlFor="otp">Enter the 6-digit code</Label>
              <InputOTP id="otp" maxLength={6} value={code} onChange={setCode} onComplete={verifyCode} autoFocus>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <Button size="lg" disabled={busy || code.length !== 6} onClick={() => verifyCode()}>
                {busy ? "Checking..." : "Verify and continue"}
              </Button>
              <div className="flex justify-between text-sm">
                <button type="button" className="text-muted-foreground underline" onClick={() => { setConfirmation(null); reset() }}>
                  Change number
                </button>
                <button type="button" className="underline disabled:text-muted-foreground disabled:no-underline" disabled={cooldown > 0 || busy} onClick={sendCode}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </div>
          )}
          <div id="recaptcha-container" />
        </TabsContent>

        <TabsContent value="google" className="flex flex-col gap-3 pt-3">
          <p className="text-sm text-muted-foreground">Use the Google account you already have. No password to remember.</p>
          <Button size="lg" onClick={google} disabled={busy}>
            {busy ? "Opening Google..." : "Continue with Google"}
          </Button>
        </TabsContent>

        <TabsContent value="email" className="pt-3">
          <form onSubmit={submitEmail} className="flex flex-col gap-3">
            <div className="grid gap-2">
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {mode !== "forgot" ? (
              <div className="grid gap-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  minLength={mode === "signup" ? 8 : undefined}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {mode === "signup" ? <p className="text-xs text-muted-foreground">At least 8 characters.</p> : null}
              </div>
            ) : null}
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? "Please wait..." : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
            </Button>
            <div className="flex justify-between text-sm text-muted-foreground">
              {mode === "signin" ? (
                <>
                  <button type="button" className="underline" onClick={() => { setMode("signup"); reset() }}>
                    Create an account
                  </button>
                  <button type="button" className="underline" onClick={() => { setMode("forgot"); reset() }}>
                    Forgot password?
                  </button>
                </>
              ) : (
                <button type="button" className="underline" onClick={() => { setMode("signin"); reset() }}>
                  Back to sign in
                </button>
              )}
            </div>
          </form>
        </TabsContent>
      </Tabs>

      {error ? <Notice tone="error">{error}</Notice> : null}
      {info ? <Notice tone="info">{info}</Notice> : null}
    </div>
  )
}
