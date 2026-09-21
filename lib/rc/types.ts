export const FUEL_TYPES = ["Petrol", "Diesel", "CNG", "LPG", "Electric", "Hybrid"] as const
export type FuelType = (typeof FUEL_TYPES)[number]

/**
 * What we keep from an RC lookup. Deliberately excludes owner name, father's name, address,
 * chassis and engine numbers: they are never stored in this shape and never shown to buyers.
 */
export type RcRecord = {
  regNumber: string
  /** e.g. "MARUTI SUZUKI INDIA LTD" */
  makerRaw: string
  /** e.g. "BALENO DDIS ALPHA" */
  modelRaw: string
  fuel: FuelType | null
  manufacturingYear: number | null
  registrationDate: string | null
  ownerCount: number | null
  insuranceValidTill: string | null
  /** true = loan/hypothecation still recorded on the RC */
  hypothecated: boolean | null
  colour: string | null
  vehicleClass: string | null
  seatingCapacity: number | null
}

export type RcErrorCode = "not_found" | "rate_limited" | "unauthorized" | "provider_error" | "invalid_reg"

export class RcError extends Error {
  code: RcErrorCode
  constructor(code: RcErrorCode, message: string) {
    super(message)
    this.name = "RcError"
    this.code = code
  }
}
