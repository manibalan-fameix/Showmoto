import type { FuelType } from "./types"

/** Petrol wins over CNG/LPG on dual-fuel cars, so "PETROL/CNG" matches the petrol variant. */
export function normalizeFuel(value: unknown): FuelType | null {
  const s = String(value ?? "").toUpperCase()
  if (!s.trim()) return null
  if (s.includes("HYBRID")) return "Hybrid"
  if (s.includes("ELECTRIC") || /\bEV\b/.test(s) || s.includes("BOV")) return "Electric"
  if (s.includes("PETROL")) return "Petrol"
  if (s.includes("DIESEL")) return "Diesel"
  if (s.includes("CNG")) return "CNG"
  if (s.includes("LPG")) return "LPG"
  return null
}

/** Accepts YYYY-MM-DD, YYYY-MM, DD-MM-YYYY, DD/MM/YYYY. Returns ISO date, or null. */
export function normalizeDate(value: unknown): string | null {
  const s = String(value ?? "").trim()
  let m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(s)
  if (m) return `${m[1]}-${m[2]}-${m[3] ?? "01"}`
  m = /^(\d{2})[-/](\d{2})[-/](\d{4})$/.exec(s)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return null
}

export function yearOf(date: string | null): number | null {
  return date ? Number(date.slice(0, 4)) : null
}

/** "1", "1st", "FIRST" -> 1. */
export function normalizeOwnerCount(value: unknown): number | null {
  const s = String(value ?? "").trim().toUpperCase()
  const words: Record<string, number> = { FIRST: 1, SECOND: 2, THIRD: 3, FOURTH: 4, FIFTH: 5 }
  if (s in words) return words[s]
  const n = parseInt(s, 10)
  return Number.isFinite(n) && n > 0 && n < 20 ? n : null
}

export function toBool(value: unknown): boolean | null {
  if (typeof value === "boolean") return value
  const s = String(value ?? "").trim().toLowerCase()
  if (["true", "yes", "y", "1"].includes(s)) return true
  if (["false", "no", "n", "0"].includes(s)) return false
  return null
}

export const clean = (v: unknown): string | null => {
  const s = String(v ?? "").trim()
  return s ? s : null
}
