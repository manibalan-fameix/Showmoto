import { readFileSync } from "node:fs"
import { describe, expect, it, vi } from "vitest"

import { parseVariantCsv } from "../lib/variants/import"
import { rankVariants, suggestVariants, type MatchQuery, type VariantRow } from "../lib/variants/match"
import type { VisionClient } from "../lib/ai/vision"

// The real shipped catalogue, so tests fail if seed data and matcher drift apart.
const catalogue: VariantRow[] = parseVariantCsv(readFileSync("data/variants/chennai-top40.csv", "utf8")).variants.map(
  (v, i) => ({ id: `v${i}`, ...v }),
)

const top = (q: MatchQuery) => rankVariants(catalogue, q)[0]?.variant
const label = (v?: VariantRow) => (v ? `${v.make} ${v.model} ${v.variant} ${v.fuel} ${v.transmission}` : "none")

describe("Phase 2 acceptance", () => {
  it('"2017 baleno alpha desil" -> Baleno Alpha diesel', () => {
    expect(label(top({ text: "2017 baleno alpha desil" }))).toBe("Maruti Suzuki Baleno Alpha Diesel Manual")
  })
  it("a raw RC maker and model string resolves to the right variant", () => {
    const v = top({ maker: "MARUTI SUZUKI INDIA LTD", model: "BALENO DDIS ALPHA", fuel: "Diesel", year: 2017 })
    expect(label(v)).toBe("Maruti Suzuki Baleno Alpha Diesel Manual")
  })
})

describe("messy dealer text and RC strings", () => {
  const cases: [string, MatchQuery, string][] = [
    ["typos", { text: "swft vdi 2014" }, "Maruti Suzuki Swift VDi Diesel Manual"],
    ["option suffix", { text: "2018 creta sx opt diesel" }, "Hyundai Creta SX(O) Diesel Manual"],
    ["RC with brackets", { maker: "HYUNDAI MOTOR INDIA LTD", model: "CRETA 1.6 CRDI SX(O)", fuel: "Diesel", year: 2018 }, "Hyundai Creta SX(O) Diesel Manual"],
    ["cvt implies automatic", { text: "honda city zx cvt 2016" }, "Honda City ZX CVT Petrol Automatic"],
    ["plus sign", { text: "tata nexon xz plus petrol 2020" }, "Tata Nexon XZ+ Petrol Manual"],
    ["nios beats plain grand i10", { text: "hyundai grand i10 nios sportz 2021" }, "Hyundai Grand i10 Nios Sportz Petrol Manual"],
    ["partial model name", { text: "brezza zdi+ 2019" }, "Maruti Suzuki Vitara Brezza ZDi+ Diesel Manual"],
    ["run-together model", { text: "wagonr 1.2 zxi 2020" }, "Maruti Suzuki Wagon R 1.2 ZXi Petrol Manual"],
    ["RC petrol/CNG dual fuel maps to petrol", { maker: "TATA MOTORS LTD", model: "NEXON XM", fuel: "Petrol", year: 2019 }, "Tata Nexon XM Petrol Manual"],
    ["rc year picks the generation", { maker: "HONDA CARS INDIA LTD", model: "CITY V", fuel: "Petrol", year: 2022 }, "Honda City V Petrol Manual"],
  ]
  for (const [name, q, expected] of cases) it(name, () => expect(label(top(q))).toBe(expected))

  it("RC fuel overrides a conflicting word in the dealer text", () => {
    const v = top({ maker: "MARUTI SUZUKI INDIA LTD", model: "SWIFT", text: "swift vxi diesel", fuel: "Petrol", year: 2019 })
    expect(v?.fuel).toBe("Petrol")
  })

  it("year separates generations of the same model", () => {
    expect(top({ text: "swift vxi 2013" })?.yearFrom).toBe(2011)
    expect(top({ text: "swift vxi 2021" })?.yearFrom).toBe(2018)
  })

  it("the right car is in the top 3 for an underspecified ask", () => {
    const top3 = rankVariants(catalogue, { text: "innova crysta zx 2019" }).slice(0, 3).map((s) => label(s.variant))
    expect(top3).toContain("Toyota Innova Crysta ZX Diesel Manual")
  })
})

describe("no false matches", () => {
  it("returns nothing for a car that is not in the catalogue", () => {
    expect(rankVariants(catalogue, { text: "tesla model 3 2021" })).toEqual([])
    expect(rankVariants(catalogue, { maker: "SKODA AUTO INDIA", model: "RAPID", year: 2018 })).toEqual([])
  })
  it("returns nothing for empty input", () => {
    expect(rankVariants(catalogue, {})).toEqual([])
    expect(rankVariants(catalogue, { text: "   " })).toEqual([])
  })
  it("does not cross makes when the RC maker is known", () => {
    const r = rankVariants(catalogue, { maker: "KIA MOTORS INDIA", model: "SELTOS HTK", year: 2020 })
    expect(r.every((s) => s.variant.make === "Kia")).toBe(true)
  })
})

describe("suggestVariants with the AI tie-break", () => {
  const ambiguous: MatchQuery = { text: "swift 2019" } // many equally plausible variants
  const fake = (ids: (r: string[]) => string[]): VisionClient => ({
    json: vi.fn(async (req) => ({ ids: ids((req.prompt.match(/^v\d+/gm) ?? []) as string[]) })) as never,
  })

  it("uses rules only when the top result is clear", async () => {
    const vision = fake((c) => c)
    const out = await suggestVariants(catalogue, { text: "2017 baleno alpha desil" }, { vision })
    expect(vision.json).not.toHaveBeenCalled()
    expect(out[0].source).toBe("rules")
  })

  it("lets the model reorder shortlisted variants when the top results are close", async () => {
    const rules = rankVariants(catalogue, ambiguous)
    const second = rules[1].variant.id
    const vision = fake(() => [second])
    const out = await suggestVariants(catalogue, ambiguous, { vision })
    expect(out[0].variant.id).toBe(second)
    expect(out[0].source).toBe("ai")
    expect(out).toHaveLength(3)
  })

  it("discards ids the model invents and never returns them", async () => {
    const vision = fake(() => ["v-does-not-exist", "totally-made-up"])
    const out = await suggestVariants(catalogue, ambiguous, { vision })
    expect(out.every((s) => catalogue.some((c) => c.id === s.variant.id))).toBe(true)
    expect(out.every((s) => s.source === "rules")).toBe(true)
  })

  it("falls back to rules when the model fails", async () => {
    const vision: VisionClient = { json: vi.fn(async () => null) as never }
    const out = await suggestVariants(catalogue, ambiguous, { vision })
    expect(out.map((s) => s.variant.id)).toEqual(rankVariants(catalogue, ambiguous).slice(0, 3).map((s) => s.variant.id))
  })

  it("works with no vision client at all", async () => {
    expect((await suggestVariants(catalogue, ambiguous, { vision: null })).length).toBe(3)
  })
})
