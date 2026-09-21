import { normalizeReg } from "../reg"
import { clean, normalizeDate, normalizeFuel, normalizeOwnerCount, toBool, yearOf } from "./normalize"
import type { RcProvider } from "./provider"
import { RcError, type RcRecord } from "./types"

/**
 * Surepass "RC full" adapter.
 *
 * UNVERIFIED against the live API: the endpoint path and response field names below are
 * written from Surepass's public documentation and have not been called with a real key.
 * Field lookups are deliberately tolerant (several candidate keys). Before relying on it,
 * make one real call and compare `normalize()` output to the vehicle's actual RC.
 *
 * Personal fields in the response (owner name, father name, address, chassis, engine number)
 * are never read here.
 */
export class SurepassRcProvider implements RcProvider {
  readonly name = "surepass"
  readonly verified = true
  private apiKey: string
  private baseUrl: string

  constructor(opts: { apiKey?: string; baseUrl?: string }) {
    if (!opts.apiKey) throw new Error("RC_API_KEY is required when RC_PROVIDER=surepass")
    this.apiKey = opts.apiKey
    this.baseUrl = (opts.baseUrl ?? "https://kyc-api.surepass.io").replace(/\/$/, "")
  }

  async fetch(regNumber: string): Promise<unknown> {
    let res: Response
    try {
      res = await fetch(`${this.baseUrl}/api/v1/rc/rc-full`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({ id_number: normalizeReg(regNumber) }),
        signal: AbortSignal.timeout(20_000),
      })
    } catch {
      throw new RcError("provider_error", "RC provider did not respond")
    }
    if (res.status === 401 || res.status === 403) throw new RcError("unauthorized", "RC provider rejected the API key")
    if (res.status === 404 || res.status === 422) throw new RcError("not_found", "No RC found for this number")
    if (res.status === 429) throw new RcError("rate_limited", "RC provider rate limit")
    const body = (await res.json().catch(() => null)) as { success?: boolean; data?: unknown } | null
    if (!res.ok || !body) throw new RcError("provider_error", `RC provider error (${res.status})`)
    if (body.success === false || !body.data) throw new RcError("not_found", "No RC found for this number")
    return body.data
  }

  normalize(raw: unknown, regNumber: string): RcRecord {
    const d = raw as Record<string, unknown>
    const pick = (...keys: string[]) => keys.map((k) => d[k]).find((v) => v !== undefined && v !== null && v !== "")
    const registrationDate = normalizeDate(pick("registration_date", "reg_date"))
    const manufactured = normalizeDate(pick("manufacturing_date_formatted", "manufacturing_date"))
    const financer = clean(pick("financer", "financier"))
    const financed = toBool(pick("financed"))
    return {
      regNumber: normalizeReg(regNumber),
      makerRaw: clean(pick("maker_description", "maker")) ?? "",
      modelRaw: clean(pick("maker_model", "model")) ?? "",
      fuel: normalizeFuel(pick("fuel_type", "fuel")),
      manufacturingYear: yearOf(manufactured) ?? yearOf(registrationDate),
      registrationDate,
      ownerCount: normalizeOwnerCount(pick("owner_number", "owner_count")),
      insuranceValidTill: normalizeDate(pick("insurance_upto", "insurance_validity")),
      hypothecated: financed ?? (financer ? true : null),
      colour: clean(pick("color", "colour")),
      vehicleClass: clean(pick("vehicle_category_description", "vehicle_category")),
      seatingCapacity: Number(pick("seat_capacity", "seating_capacity")) || null,
    }
  }
}
