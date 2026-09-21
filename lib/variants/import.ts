import { parseCsv } from "./csv.ts"

export type VariantInput = {
  make: string
  model: string
  variant: string
  fuel: string
  transmission: string
  engineCc: number | null
  yearFrom: number
  yearTo: number | null
  specs: Record<string, Record<string, string | number | boolean>>
  features: Record<string, string[]>
}

export type ImportError = { line: number; message: string }

const FUELS: Record<string, string> = {
  petrol: "Petrol", diesel: "Diesel", cng: "CNG", lpg: "LPG", electric: "Electric", ev: "Electric", hybrid: "Hybrid",
}
const TRANSMISSIONS: Record<string, string> = {
  manual: "Manual", mt: "Manual", automatic: "Automatic", auto: "Automatic", at: "Automatic",
  amt: "Automatic", cvt: "Automatic", dct: "Automatic",
}
const REQUIRED = ["make", "model", "variant", "fuel", "transmission", "year_from"] as const

function cast(value: string): string | number | boolean {
  const v = value.trim()
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v)
  if (/^(true|yes)$/i.test(v)) return true
  if (/^(false|no)$/i.test(v)) return false
  return v
}

function toInt(value: string | undefined): number | null {
  const v = (value ?? "").trim()
  if (v === "") return null
  return /^\d+$/.test(v) ? Number(v) : Number.NaN
}

/**
 * Columns: make, model, variant, fuel, transmission, year_from (required); engine_cc, year_to (optional);
 * `spec.<Group>.<Name>` -> specs[Group][Name]; `features.<Group>` -> features[Group] (values split on "|").
 * Blank year_to means still on sale. Unknown columns are reported, not silently dropped.
 */
export function parseVariantCsv(text: string): { variants: VariantInput[]; errors: ImportError[] } {
  const table = parseCsv(text)
  const errors: ImportError[] = []
  if (table.length === 0) return { variants: [], errors: [{ line: 1, message: "File is empty" }] }

  const header = table[0].map((h) => h.trim())
  const missing = REQUIRED.filter((c) => !header.includes(c))
  if (missing.length) return { variants: [], errors: [{ line: 1, message: `Missing columns: ${missing.join(", ")}` }] }

  const known = new Set<string>([...REQUIRED, "engine_cc", "year_to"])
  for (const h of header) {
    if (!known.has(h) && !h.startsWith("spec.") && !h.startsWith("features.")) {
      errors.push({ line: 1, message: `Unknown column "${h}" (use spec.<Group>.<Name> or features.<Group>)` })
    }
  }

  const variants: VariantInput[] = []
  for (let r = 1; r < table.length; r++) {
    const line = r + 1
    const cells = table[r]
    const get = (name: string) => cells[header.indexOf(name)]?.trim() ?? ""
    const rowErrors: string[] = []

    for (const c of REQUIRED) if (!get(c)) rowErrors.push(`${c} is required`)
    const fuel = FUELS[get("fuel").toLowerCase()]
    if (get("fuel") && !fuel) rowErrors.push(`unknown fuel "${get("fuel")}"`)
    const transmission = TRANSMISSIONS[get("transmission").toLowerCase()]
    if (get("transmission") && !transmission) rowErrors.push(`unknown transmission "${get("transmission")}"`)
    const yearFrom = toInt(get("year_from"))
    const yearTo = toInt(get("year_to"))
    const engineCc = toInt(get("engine_cc"))
    if (yearFrom === null || Number.isNaN(yearFrom) || yearFrom < 1990 || yearFrom > 2100) rowErrors.push("year_from must be a year")
    if (yearTo !== null && (Number.isNaN(yearTo) || (yearFrom !== null && yearTo < yearFrom))) rowErrors.push("year_to must be a year not before year_from")
    if (engineCc !== null && Number.isNaN(engineCc)) rowErrors.push("engine_cc must be a number")

    const specs: VariantInput["specs"] = {}
    const features: VariantInput["features"] = {}
    header.forEach((h, i) => {
      const value = cells[i]?.trim() ?? ""
      if (!value) return
      if (h.startsWith("spec.")) {
        const [, group, ...rest] = h.split(".")
        const name = rest.join(".")
        if (!group || !name) return void rowErrors.push(`bad spec column "${h}"`)
        ;(specs[group] ??= {})[name] = cast(value)
      } else if (h.startsWith("features.")) {
        const group = h.slice("features.".length)
        if (!group) return void rowErrors.push(`bad features column "${h}"`)
        features[group] = value.split("|").map((s) => s.trim()).filter(Boolean)
      }
    })

    if (rowErrors.length) {
      errors.push({ line, message: rowErrors.join("; ") })
      continue
    }
    variants.push({
      make: get("make"), model: get("model"), variant: get("variant"),
      fuel: fuel!, transmission: transmission!,
      engineCc: engineCc, yearFrom: yearFrom!, yearTo, specs, features,
    })
  }

  // Duplicate natural keys would make the upsert ambiguous.
  const seen = new Map<string, number>()
  variants.forEach((v, i) => {
    const key = [v.make, v.model, v.variant, v.fuel, v.transmission, v.yearFrom].join("|").toLowerCase()
    if (seen.has(key)) errors.push({ line: i + 2, message: `duplicate of an earlier row: ${key}` })
    seen.set(key, i)
  })

  return { variants, errors }
}
