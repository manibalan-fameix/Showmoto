import { describe, expect, it } from "vitest"

import { classifyHost, isValidSlug, normalizeHost } from "../lib/tenant/host"

const ROOT = "fameix.in"

describe("classifyHost", () => {
  it("routes the root and www to marketing", () => {
    expect(classifyHost("fameix.in", ROOT)).toEqual({ kind: "marketing" })
    expect(classifyHost("www.fameix.in", ROOT)).toEqual({ kind: "marketing" })
  })
  it("routes app.<root> to admin", () => {
    expect(classifyHost("app.fameix.in", ROOT)).toEqual({ kind: "admin" })
  })
  it("routes dealer subdomains", () => {
    expect(classifyHost("sri-motors.fameix.in", ROOT)).toEqual({ kind: "subdomain", slug: "sri-motors" })
  })
  it("ignores ports, case and trailing dots", () => {
    expect(classifyHost("Sri-Motors.FAMEIX.in:443", ROOT)).toEqual({ kind: "subdomain", slug: "sri-motors" })
    expect(classifyHost("app.fameix.in.", ROOT)).toEqual({ kind: "admin" })
  })
  it("works on localhost with a port in ROOT_DOMAIN", () => {
    expect(classifyHost("demo.localhost:3000", "localhost:3000")).toEqual({ kind: "subdomain", slug: "demo" })
    expect(classifyHost("app.localhost:3000", "localhost:3000")).toEqual({ kind: "admin" })
    expect(classifyHost("localhost:3000", "localhost:3000")).toEqual({ kind: "marketing" })
  })
  it("rejects nested, reserved and malformed subdomains", () => {
    expect(classifyHost("a.b.fameix.in", ROOT).kind).toBe("invalid")
    expect(classifyHost("api.fameix.in", ROOT).kind).toBe("invalid")
    expect(classifyHost("-bad.fameix.in", ROOT).kind).toBe("invalid")
    expect(classifyHost("under_score.fameix.in", ROOT).kind).toBe("invalid")
  })
  it("does not treat lookalike domains as subdomains", () => {
    expect(classifyHost("evilfameix.in", ROOT)).toEqual({ kind: "custom", hostname: "evilfameix.in" })
    expect(classifyHost("fameix.in.evil.com", ROOT)).toEqual({ kind: "custom", hostname: "fameix.in.evil.com" })
  })
  it("sends unknown hosts to the custom-domain lookup", () => {
    expect(classifyHost("www.sridealer.com", ROOT)).toEqual({ kind: "custom", hostname: "www.sridealer.com" })
  })
  it("treats a missing host as invalid", () => {
    expect(classifyHost(null, ROOT).kind).toBe("invalid")
    expect(classifyHost("", ROOT).kind).toBe("invalid")
  })
})

describe("slugs", () => {
  it("validates", () => {
    expect(isValidSlug("sri-motors")).toBe(true)
    expect(isValidSlug("a")).toBe(true)
    expect(isValidSlug("app")).toBe(false)
    expect(isValidSlug("Has-Caps")).toBe(false)
    expect(isValidSlug("x".repeat(41))).toBe(false)
  })
  it("normalizeHost", () => {
    expect(normalizeHost(" Foo.com:8080 ")).toBe("foo.com")
  })
})
