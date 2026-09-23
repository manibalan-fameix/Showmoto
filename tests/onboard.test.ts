import { describe, expect, it } from "vitest"

import { onboardSchema } from "../lib/dealers/onboard"

const ok = { displayName: "Sri Murugan Motors", slug: "sri-murugan", city: "Chennai", phone: "+91 98765 43210" }

describe("onboarding input", () => {
  it("accepts a valid dealership and normalises the phone number", () => {
    const r = onboardSchema.safeParse(ok)
    expect(r.success && r.data.phone).toBe("+919876543210")
  })
  it("rejects reserved, malformed and uppercase-only-invalid slugs", () => {
    for (const slug of ["app", "www", "api", "a", "-bad", "has space", "x.y"]) {
      expect(onboardSchema.safeParse({ ...ok, slug }).success).toBe(false)
    }
    expect(onboardSchema.safeParse({ ...ok, slug: "Sri-Murugan" }).success).toBe(true) // lowercased
  })
  it("rejects a bad phone number and an empty name", () => {
    expect(onboardSchema.safeParse({ ...ok, phone: "12345" }).success).toBe(false)
    expect(onboardSchema.safeParse({ ...ok, displayName: " " }).success).toBe(false)
  })
})
