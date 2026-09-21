import { describe, expect, it } from "vitest"

import { contrastRatio, readableOn, themeToCssVars, validateTheme } from "../lib/theme/tokens"

const base = { primary: "#1d4ed8", primaryForeground: "#ffffff", accent: "#f59e0b", radius: "md" as const }

describe("contrast", () => {
  it("matches WCAG reference values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1)
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5)
  })
  it("readableOn always reaches AA on mid-tones", () => {
    for (const c of ["#777777", "#808080", "#767676", "#ff0000", "#00aa55", "#f59e0b"]) {
      expect(contrastRatio(c, readableOn(c))).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe("validateTheme", () => {
  it("accepts a compliant theme unchanged", () => {
    const r = validateTheme(base)
    expect(r).toEqual({ ok: true, theme: base, adjustments: [] })
  })
  it("auto-adjusts unreadable foreground text", () => {
    const r = validateTheme({ ...base, primary: "#0b3d91", primaryForeground: "#1d4ed8" })
    expect(r.ok && r.theme.primaryForeground).toBe("#ffffff")
    expect(r.ok && r.adjustments.length).toBe(1)
  })
  it("rejects a primary too light for a white page", () => {
    const r = validateTheme({ ...base, primary: "#ffee00" })
    expect(r.ok).toBe(false)
  })
  it("rejects free-form values", () => {
    expect(validateTheme({ ...base, primary: "red" }).ok).toBe(false)
    expect(validateTheme({ ...base, radius: "999px" }).ok).toBe(false)
  })
  it("emits the CSS variables that override the preset", () => {
    const vars = themeToCssVars(base)
    expect(vars["--primary"]).toBe("#1d4ed8")
    expect(vars["--radius"]).toBe("0.625rem")
    expect(vars["--accent-foreground"]).toMatch(/^#/)
  })
})
