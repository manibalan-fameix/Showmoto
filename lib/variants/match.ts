import { z } from "zod"

import type { VisionClient } from "../ai/vision"

export type VariantRow = {
  id: string
  make: string
  model: string
  variant: string
  fuel: string
  transmission: string
  engineCc: number | null
  yearFrom: number
  yearTo: number | null
}

/** Everything we know about the car: RC strings (raw, messy) and/or the dealer's own words. */
export type MatchQuery = {
  maker?: string | null
  /** RC model string, e.g. "BALENO DDIS ALPHA" */
  model?: string | null
  /** Dealer free text, e.g. "2017 baleno alpha desil" */
  text?: string | null
  /** Authoritative when present (from the RC). */
  fuel?: string | null
  year?: number | null
}

export type Suggestion = { variant: VariantRow; score: number; reasons: string[]; source: "rules" | "ai" }

// ---------- text helpers ----------

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/\(o\)/g, " o ")
    .replace(/\bopt(?:ion|ional)?\b/g, " o ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

const tokens = (s: string) => normalize(s).split(" ").filter(Boolean)

export function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return dp[a.length][b.length]
}

/** Exact, or a small typo for words of 4+ letters (1 edit, 2 for 7+). */
function tokenMatches(bagToken: string, want: string): boolean {
  if (bagToken === want) return true
  if (want.length < 4) return false
  const max = want.length >= 7 ? 2 : 1
  return Math.abs(bagToken.length - want.length) <= max && levenshtein(bagToken, want) <= max
}

const bagHas = (bag: string[], want: string) => bag.some((b) => tokenMatches(b, want))

// ---------- vocabulary ----------

const FUEL_WORDS: Record<string, string[]> = {
  Diesel: ["diesel", "desil", "deisel", "dsl", "ddis", "crdi", "tdi", "dci", "mhawk", "tdci"],
  Petrol: ["petrol", "patrol", "petro", "gasoline", "vvt", "kappa", "dualjet"],
  CNG: ["cng"],
  Electric: ["electric", "ev"],
  Hybrid: ["hybrid"],
}
const TRANSMISSION_WORDS: Record<string, string[]> = {
  Automatic: ["auto", "automatic", "amt", "cvt", "dct", "ags", "at", "ivt", "tct"],
  Manual: ["manual", "mt"],
}

function hintFrom(bag: string[], words: Record<string, string[]>): string | null {
  for (const [label, list] of Object.entries(words)) if (list.some((w) => bagHas(bag, w))) return label
  return null
}

// ---------- scoring ----------

type Ctx = {
  bag: string[]
  joined: string
  makerTokens: string[]
  fuel: string | null
  fuelFromRc: boolean
  transmission: string | null
  year: number | null
}

function modelMatch(model: string, ctx: Ctx): { score: number; how: string } | null {
  const mt = tokens(model)
  const joined = mt.join("")
  // Full match: the model's words appear consecutively (typos allowed), or as one run ("wagonr").
  for (let i = 0; i + mt.length <= ctx.bag.length; i++) {
    if (mt.every((t, k) => tokenMatches(ctx.bag[i + k], t))) return { score: 20 + joined.length, how: "model" }
  }
  if (joined.length >= 5 && ctx.joined.includes(joined)) return { score: 20 + joined.length, how: "model" }
  // Partial: a distinctive word of a multi-word model ("brezza" for "Vitara Brezza").
  if (mt.length > 1) {
    const key = mt.filter((t) => t.length >= 5).find((t) => bagHas(ctx.bag, t))
    if (key) return { score: 12 + key.length, how: "model (partial)" }
  }
  return null
}

function scoreVariant(v: VariantRow, ctx: Ctx, hasMaker: boolean): Suggestion | null {
  const reasons: string[] = []
  let score = 0

  const makeWord = tokens(v.make)[0]
  const makeOk = ctx.makerTokens.includes(makeWord) || ctx.bag.includes(makeWord)
  if (hasMaker && !makeOk) return null
  if (makeOk) score += 6

  const m = modelMatch(v.model, ctx)
  if (!m) return null
  score += m.score
  reasons.push(m.how)

  const vTokens = tokens(v.variant)
  const matched = vTokens.filter((t) => bagHas(ctx.bag, t))
  if (matched.length) {
    score += matched.reduce((a, t) => a + t.length + 2, 0)
    reasons.push("variant")
    if (matched.length === vTokens.length) score += 6
    else score -= 2 * (vTokens.length - matched.length)
  }

  if (ctx.fuel) {
    if (v.fuel === ctx.fuel) {
      score += 8
      reasons.push("fuel")
    } else score -= 12
  }
  if (ctx.transmission) {
    if (v.transmission === ctx.transmission) {
      score += 5
      reasons.push("transmission")
    } else score -= 6
  }

  if (ctx.year) {
    const end = v.yearTo ?? 9999
    if (ctx.year >= v.yearFrom && ctx.year <= end) {
      score += 8
      reasons.push("year")
    } else {
      // Registration can trail manufacture by a year; beyond that, penalise by distance.
      const gap = ctx.year < v.yearFrom ? v.yearFrom - ctx.year : ctx.year - end
      score += gap <= 1 ? 2 : -Math.min(20, 6 + gap * 2)
    }
  }
  return { variant: v, score, reasons, source: "rules" }
}

function yearFromText(text: string): number | null {
  const m = /(?<![\d.])(?:19[89]\d|20[0-4]\d)(?![\d.])/.exec(text)
  return m ? Number(m[0]) : null
}

/** Pure ranking over a list of catalogue rows. Best first; empty when nothing matches the model. */
export function rankVariants(all: VariantRow[], q: MatchQuery): Suggestion[] {
  const text = [q.model, q.text].filter(Boolean).join(" ")
  const bag = tokens(text)
  if (bag.length === 0) return []

  const rcFuel = q.fuel ?? null
  const ctx: Ctx = {
    bag,
    joined: bag.join(""),
    makerTokens: tokens(q.maker ?? ""),
    fuel: rcFuel ?? hintFrom(bag, FUEL_WORDS),
    fuelFromRc: Boolean(rcFuel),
    transmission: hintFrom(bag, TRANSMISSION_WORDS),
    year: q.year ?? yearFromText(q.text ?? ""),
  }
  const hasMaker = ctx.makerTokens.length > 0

  const scored = all.map((v) => scoreVariant(v, ctx, hasMaker)).filter((s): s is Suggestion => s !== null)
  const yr = ctx.year
  const distance = (s: Suggestion) => (yr ? Math.abs(yr - s.variant.yearFrom) : 0)
  return scored.sort(
    (a, b) => b.score - a.score || distance(a) - distance(b) || a.variant.variant.localeCompare(b.variant.variant),
  )
}

// ---------- AI tie-break ----------

const AMBIGUITY_GAP = 6
const AI_CANDIDATES = 8

const aiAnswer = z.object({ ids: z.array(z.string()) })

function describe(v: VariantRow) {
  const years = `${v.yearFrom}-${v.yearTo ?? "now"}`
  return `${v.id} | ${v.make} ${v.model} ${v.variant} | ${v.fuel} | ${v.transmission} | ${years}${v.engineCc ? ` | ${v.engineCc}cc` : ""}`
}

/**
 * Ask the model to order shortlisted catalogue rows. It can only pick from the ids we send:
 * anything else is discarded, so it can reorder but never invent a variant or its specs.
 */
async function aiOrder(vision: VisionClient, q: MatchQuery, candidates: Suggestion[]): Promise<string[] | null> {
  const allowed = new Set(candidates.map((c) => c.variant.id))
  const result = await vision.json({
    system:
      "You match a used-car description to entries in a fixed catalogue. " +
      "Answer only with ids copied from the catalogue list, best match first. Never invent an id.",
    prompt: [
      "Car description:",
      `Registration maker: ${q.maker ?? "unknown"}`,
      `Registration model: ${q.model ?? "unknown"}`,
      `Registration fuel: ${q.fuel ?? "unknown"}`,
      `Year: ${q.year ?? "unknown"}`,
      `Dealer's words: ${q.text ?? "none"}`,
      "",
      "Catalogue (id | car | fuel | transmission | years):",
      ...candidates.map((c) => describe(c.variant)),
    ].join("\n"),
    jsonSchema: {
      type: "object",
      properties: { ids: { type: "array", items: { type: "string" } } },
      required: ["ids"],
      additionalProperties: false,
    },
    validate: aiAnswer,
    maxTokens: 500,
  })
  if (!result) return null
  const ids = [...new Set(result.ids.filter((id) => allowed.has(id)))]
  return ids.length ? ids : null
}

/** Top suggestions for the dealer to tap. Rules first; the model is only consulted when the top two are close. */
export async function suggestVariants(
  all: VariantRow[],
  q: MatchQuery,
  opts: { vision?: VisionClient | null; limit?: number } = {},
): Promise<Suggestion[]> {
  const limit = opts.limit ?? 3
  const ranked = rankVariants(all, q)
  const ambiguous = ranked.length >= 2 && ranked[0].score - ranked[1].score < AMBIGUITY_GAP
  if (!opts.vision || !ambiguous) return ranked.slice(0, limit)

  const shortlist = ranked.slice(0, AI_CANDIDATES)
  const order = await aiOrder(opts.vision, q, shortlist)
  if (!order) return ranked.slice(0, limit)

  const byId = new Map(shortlist.map((s) => [s.variant.id, s]))
  const picked = order.map((id) => ({ ...byId.get(id)!, source: "ai" as const }))
  const rest = shortlist.filter((s) => !order.includes(s.variant.id))
  return [...picked, ...rest].slice(0, limit)
}
