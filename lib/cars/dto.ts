import type { RcRecord } from "../rc/types.ts"

/** RC facts safe to show the dealer. No owner name, address, chassis or engine numbers exist here. */
export type RcSummary = {
  makerRaw: string
  modelRaw: string
  fuel: string | null
  year: number | null
  ownerCount: number | null
  insuranceValidTill: string | null
  hypothecated: boolean | null
  colour: string | null
}

export const toRcSummary = (r: RcRecord): RcSummary => ({
  makerRaw: r.makerRaw,
  modelRaw: r.modelRaw,
  fuel: r.fuel,
  year: r.manufacturingYear,
  ownerCount: r.ownerCount,
  insuranceValidTill: r.insuranceValidTill,
  hypothecated: r.hypothecated,
  colour: r.colour,
})

export type VariantSuggestion = {
  id: string
  label: string
  fuel: string
  transmission: string
  years: string
  engineCc: number | null
  source: "rules" | "ai"
}
