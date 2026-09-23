"use client"

import Link from "next/link"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  DAYS,
  HOURS_PRESETS,
  PALETTES,
  RADIUS_KEYS,
  type OnboardDraft,
  onboardSchema,
  slugSchema,
} from "@/lib/dealers/onboard"
import type { DayKey } from "@/lib/hours"
import { RADIUS_OPTIONS, readableOn } from "@/lib/theme/tokens"
import { slugify } from "@/lib/slug"
import { cn } from "@/lib/utils"

import { type SlugStatus, checkSlug, createDealership } from "./actions"

const STEPS = ["Your showroom", "Contact and hours", "Make it yours"] as const
const CITY_SUGGESTIONS = ["Chennai", "Bengaluru", "Hyderabad", "Mumbai", "Pune", "Delhi", "Kolkata", "Coimbatore", "Madurai", "Kochi", "Ahmedabad", "Jaipur"]

type Errors = Partial<Record<keyof OnboardDraft | "form", string>>

const initialHours = () => {
  const p = HOURS_PRESETS[0]
  return Object.fromEntries(p.days.map((d) => [d, { open: p.open, close: p.close }])) as OnboardDraft["hours"]
}

export function OnboardingWizard({ rootDomain, firstName }: { rootDomain: string; firstName: string }) {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Errors>({})

  const [displayName, setDisplayName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugEdited, setSlugEdited] = useState(false)
  const [remote, setRemote] = useState<{ slug: string; status: SlugStatus } | null>(null)
  const [city, setCity] = useState("")
  const [phone, setPhone] = useState("")
  const [hours, setHours] = useState<OnboardDraft["hours"]>(initialHours)
  const [primary, setPrimary] = useState<string>(PALETTES[0].primary)
  const [accent, setAccent] = useState<string>(PALETTES[0].accent)
  const [radius, setRadius] = useState<OnboardDraft["radius"]>("md")

  // Live availability check, debounced. Only the async answer is state; idle/invalid/checking are derived,
  // and an answer for a stale slug is ignored.
  const parsedSlug = slugSchema.safeParse(slug)
  const slugStatus: SlugStatus | "checking" | "idle" = !slug
    ? "idle"
    : !parsedSlug.success
      ? "invalid"
      : remote?.slug === parsedSlug.data
        ? remote.status
        : "checking"
  useEffect(() => {
    const parsed = slugSchema.safeParse(slug)
    if (!parsed.success) return
    let stale = false
    const t = setTimeout(async () => {
      const status = await checkSlug(parsed.data).catch(() => "limited" as const)
      if (!stale) setRemote({ slug: parsed.data, status })
    }, 400)
    return () => {
      stale = true
      clearTimeout(t)
    }
  }, [slug])

  const draft: OnboardDraft = { displayName, slug, city, phone, hours, primary, accent, radius }

  function validate(fields: (keyof OnboardDraft)[]): boolean {
    const result = onboardSchema.safeParse(draft)
    const next: Errors = {}
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof OnboardDraft
        if (fields.includes(key)) next[key] ??= issue.message
      }
    }
    if (fields.includes("slug") && !next.slug) {
      if (slugStatus === "taken") next.slug = "That web address is taken. Try another."
      else if (slugStatus === "checking" || slugStatus === "idle") next.slug = "Hold on, checking that address..."
      else if (slugStatus === "limited") next.slug = "Too many checks. Wait a moment and try again."
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const next = () => {
    const ok = step === 0 ? validate(["displayName", "slug"]) : validate(["city", "phone", "hours"])
    if (ok) setStep((s) => s + 1)
  }

  function submit() {
    if (!validate(["primary", "accent", "radius"])) return
    startTransition(async () => {
      const result = await createDealership(draft)
      if (result.ok) return setDone(result.url)
      if (result.fieldErrors) {
        setErrors(result.fieldErrors as Errors)
        setStep(result.fieldErrors.slug || result.fieldErrors.displayName ? 0 : 1)
      } else {
        setErrors({ form: result.error })
      }
    })
  }

  if (done) return <Success url={done} name={displayName} />

  const setDay = (day: DayKey, on: boolean) =>
    setHours((h) => {
      const copy = { ...h }
      const ref = Object.values(h)[0] ?? { open: "10:00", close: "19:00" }
      if (on) copy[day] = ref
      else delete copy[day]
      return copy
    })
  const ref = Object.values(hours)[0] ?? { open: "10:00", close: "19:00" }
  const setTimes = (open: string, close: string) =>
    setHours((h) => Object.fromEntries(Object.keys(h).map((d) => [d, { open, close }])) as OnboardDraft["hours"])

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <p className="text-sm text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </p>
        <Progress value={((step + 1) / STEPS.length) * 100} aria-label={`Step ${step + 1} of ${STEPS.length}`} />
        <CardTitle className="pt-2 text-xl">
          {step === 0 ? (firstName ? `Welcome, ${firstName}. Let's set up your showroom` : "Let's set up your showroom") : STEPS[step]}
        </CardTitle>
        <CardDescription>
          {step === 0 && "This is what buyers will see. You can change it any time."}
          {step === 1 && "Buyers call this number and use your hours to book test drives."}
          {step === 2 && "Pick a colour for your showroom page. The preview updates live."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {step === 0 && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="displayName">Dealership name</Label>
              <Input
                id="displayName"
                value={displayName}
                placeholder="Sri Murugan Motors"
                autoFocus
                autoComplete="organization"
                onChange={(e) => {
                  setDisplayName(e.target.value)
                  if (!slugEdited) setSlug(slugify(e.target.value).slice(0, 40))
                }}
              />
              <FieldError message={errors.displayName} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Your web address</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="slug"
                  value={slug}
                  autoCapitalize="none"
                  spellCheck={false}
                  onChange={(e) => {
                    setSlugEdited(true)
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }}
                />
                <span className="text-sm whitespace-nowrap text-muted-foreground">.{rootDomain}</span>
              </div>
              <SlugHint status={slugStatus} slug={slug} rootDomain={rootDomain} />
              <FieldError message={errors.slug} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" list="cities" value={city} placeholder="Chennai" autoComplete="address-level2" onChange={(e) => setCity(e.target.value)} />
              <datalist id="cities">
                {CITY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <FieldError message={errors.city} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Mobile number buyers can call</Label>
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
              <FieldError message={errors.phone} />
            </div>
            <div className="grid gap-3">
              <Label>Business hours</Label>
              <div className="flex flex-wrap gap-2">
                {HOURS_PRESETS.map((p) => (
                  <Button
                    key={p.label}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setHours(Object.fromEntries(p.days.map((d) => [d, { open: p.open, close: p.close }])) as OnboardDraft["hours"])
                    }
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Days you are open">
                {DAYS.map((d) => {
                  const on = Boolean(hours[d.key])
                  return (
                    <Button key={d.key} type="button" size="sm" variant={on ? "default" : "outline"} aria-pressed={on} onClick={() => setDay(d.key, !on)}>
                      {d.label}
                    </Button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2">
                <Input type="time" aria-label="Opens at" value={ref.open} onChange={(e) => setTimes(e.target.value, ref.close)} />
                <span className="text-sm text-muted-foreground">to</span>
                <Input type="time" aria-label="Closes at" value={ref.close} onChange={(e) => setTimes(ref.open, e.target.value)} />
              </div>
              <FieldError message={errors.hours} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid gap-2">
              <Label>Brand colour</Label>
              <div className="flex flex-wrap items-center gap-2">
                {PALETTES.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    title={p.name}
                    aria-label={p.name}
                    aria-pressed={primary === p.primary}
                    onClick={() => {
                      setPrimary(p.primary)
                      setAccent(p.accent)
                    }}
                    className={cn("size-9 rounded-full border-2 border-transparent", primary === p.primary && "ring-2 ring-ring ring-offset-2 ring-offset-background")}
                    style={{ backgroundColor: p.primary }}
                  />
                ))}
                <label className="ml-1 flex items-center gap-2 text-sm text-muted-foreground">
                  Custom
                  <input type="color" aria-label="Custom brand colour" value={primary} onChange={(e) => setPrimary(e.target.value)} className="size-9 cursor-pointer rounded-md border bg-transparent p-0.5" />
                </label>
              </div>
              <FieldError message={errors.primary} />
            </div>
            <div className="grid gap-2">
              <Label>Corner style</Label>
              <div className="flex gap-2" role="group" aria-label="Corner style">
                {RADIUS_KEYS.map((r) => (
                  <Button key={r} type="button" size="sm" variant={radius === r ? "default" : "outline"} aria-pressed={radius === r} onClick={() => setRadius(r)}>
                    {r === "none" ? "Square" : r === "sm" ? "Soft" : r === "md" ? "Rounded" : "Round"}
                  </Button>
                ))}
              </div>
            </div>
            <Preview name={displayName || "Your Dealership"} city={city || "Your city"} primary={primary} accent={accent} radius={radius} />
            <p className="text-xs text-muted-foreground">You can add your logo and fine-tune colours later in Settings.</p>
          </>
        )}

        {errors.form ? <p role="alert" className="text-sm text-destructive">{errors.form}</p> : null}

        <div className="flex items-center justify-between pt-1">
          <Button type="button" variant="ghost" disabled={step === 0 || pending} onClick={() => { setErrors({}); setStep((s) => s - 1) }}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" size="lg" onClick={next}>
              Continue
            </Button>
          ) : (
            <Button type="button" size="lg" disabled={pending} onClick={submit}>
              {pending ? "Creating your showroom..." : "Create my showroom"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function FieldError({ message }: { message?: string }) {
  return message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null
}

function SlugHint({ status, slug, rootDomain }: { status: SlugStatus | "checking" | "idle"; slug: string; rootDomain: string }) {
  if (status === "idle") return <p className="text-xs text-muted-foreground">Letters, numbers and hyphens. Your link will be {`<name>.${rootDomain}`}.</p>
  if (status === "checking") return <p className="text-xs text-muted-foreground">Checking...</p>
  if (status === "available") return <p className="text-xs text-primary">{slug}.{rootDomain} is available.</p>
  if (status === "taken") return <p className="text-xs text-destructive">{slug}.{rootDomain} is taken. Try adding your city.</p>
  if (status === "limited") return <p className="text-xs text-muted-foreground">Too many checks. Wait a moment.</p>
  return <p className="text-xs text-destructive">Use 2 or more letters, numbers or hyphens. Some names are reserved.</p>
}

/** A miniature of the buyer-facing page, styled with the chosen theme. Colours here are the dealer's own data. */
function Preview({ name, city, primary, accent, radius }: { name: string; city: string; primary: string; accent: string; radius: OnboardDraft["radius"] }) {
  const fg = readableOn(primary)
  const r = RADIUS_OPTIONS[radius]
  return (
    <div className="overflow-hidden border bg-background" style={{ borderRadius: r }} aria-label="Preview of your showroom page">
      <div className="px-4 py-3" style={{ backgroundColor: primary, color: fg }}>
        <p className="font-semibold">{name}</p>
        <p className="text-xs opacity-80">{city}</p>
      </div>
      <div className="flex gap-3 p-4">
        <div className="size-16 shrink-0 bg-muted" style={{ borderRadius: r }} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-sm font-medium">2019 Hyundai Creta SX</p>
          <p className="text-xs text-muted-foreground">Diesel · 31,500 km · 1 owner</p>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-sm font-semibold">₹11,25,000</span>
            <span className="px-2 py-0.5 text-xs" style={{ backgroundColor: accent, color: readableOn(accent), borderRadius: r }}>
              Verified
            </span>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="px-4 py-2 text-center text-sm font-medium" style={{ backgroundColor: primary, color: fg, borderRadius: r }}>
          Book a test drive
        </div>
      </div>
    </div>
  )
}

function Success({ url, name }: { url: string; name: string }) {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-xl">{name} is live</CardTitle>
        <CardDescription>Your showroom has its own link. Add a car and share it on WhatsApp and Instagram.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2 rounded-lg border p-3">
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => navigator.clipboard.writeText(url).then(() => toast.success("Link copied"), () => toast.error("Could not copy"))}
          >
            Copy
          </Button>
        </div>
        <Link href="/cars/new" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
          Add your first car
        </Link>
        <div className="flex justify-between text-sm">
          <Link href="/dashboard" className="text-muted-foreground underline">
            Go to dashboard
          </Link>
          <a href={url} target="_blank" rel="noreferrer" className="text-muted-foreground underline">
            View my showroom
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
