"use client"

import { useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { slugify } from "@/lib/slug"

import { type OnboardState, createDealership } from "./actions"

const initialState: OnboardState = {}

export function OnboardingForm({ rootDomain, defaultName }: { rootDomain: string; defaultName: string }) {
  const [state, formAction, pending] = useActionState(createDealership, initialState)
  const [name, setName] = useState(defaultName)
  const [slug, setSlug] = useState(slugify(defaultName).slice(0, 40))
  const [slugEdited, setSlugEdited] = useState(false)
  const errors = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="displayName">Dealership name</Label>
        <Input
          id="displayName"
          name="displayName"
          value={name}
          placeholder="Sri Murugan Motors"
          required
          onChange={(e) => {
            setName(e.target.value)
            if (!slugEdited) setSlug(slugify(e.target.value).slice(0, 40))
          }}
        />
        {errors.displayName ? <p className="text-sm text-destructive">{errors.displayName}</p> : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="slug">Your web address</Label>
        <div className="flex items-center gap-2">
          <Input
            id="slug"
            name="slug"
            value={slug}
            required
            autoCapitalize="none"
            onChange={(e) => {
              setSlugEdited(true)
              setSlug(e.target.value.toLowerCase())
            }}
          />
          <span className="text-sm whitespace-nowrap text-muted-foreground">.{rootDomain}</span>
        </div>
        {errors.slug ? <p className="text-sm text-destructive">{errors.slug}</p> : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="city">City</Label>
        <Input id="city" name="city" placeholder="Chennai" required />
        {errors.city ? <p className="text-sm text-destructive">{errors.city}</p> : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone (buyers will call this)</Label>
        <Input id="phone" name="phone" type="tel" placeholder="+91 98765 43210" required />
        {errors.phone ? <p className="text-sm text-destructive">{errors.phone}</p> : null}
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Creating..." : "Create my showroom"}
      </Button>
    </form>
  )
}
