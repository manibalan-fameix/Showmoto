import { normalizeReg } from "../reg"
import { clean, normalizeDate, normalizeFuel, normalizeOwnerCount, toBool, yearOf } from "./normalize"
import type { RcProvider } from "./provider"
import { RcError, type RcRecord } from "./types"

// Fixtures use the same raw shape as a real provider so normalize() gets exercised end to end.
const FIXTURES = [
  { maker_description: "MARUTI SUZUKI INDIA LTD", maker_model: "BALENO DDIS ALPHA", fuel_type: "DIESEL", registration_date: "2017-04-12", owner_number: "1", color: "PEARL WHITE", financed: false, insurance_upto: "2027-03-31", seat_capacity: 5 },
  { maker_description: "HYUNDAI MOTOR INDIA LTD", maker_model: "CRETA 1.6 CRDI SX(O)", fuel_type: "DIESEL", registration_date: "2018-08-03", owner_number: "2", color: "PHANTOM BLACK", financed: false, insurance_upto: "2026-11-15", seat_capacity: 5 },
  { maker_description: "HONDA CARS INDIA LTD", maker_model: "CITY 1.5 V MT", fuel_type: "PETROL", registration_date: "2016-01-20", owner_number: "1", color: "SILVER", financed: true, insurance_upto: "2027-01-19", seat_capacity: 5 },
  { maker_description: "TATA MOTORS LTD", maker_model: "NEXON XZ+", fuel_type: "PETROL", registration_date: "2019-06-28", owner_number: "1", color: "RED", financed: false, insurance_upto: "2026-06-27", seat_capacity: 5 },
  { maker_description: "MAHINDRA & MAHINDRA LIMITED", maker_model: "SCORPIO S10", fuel_type: "DIESEL", registration_date: "2017-11-09", owner_number: "3", color: "WHITE", financed: false, insurance_upto: "2027-02-08", seat_capacity: 7 },
]

/**
 * Deterministic fake provider for development and tests.
 * A reg ending 0000 is "not found"; one ending 9999 simulates a provider outage.
 */
export class MockRcProvider implements RcProvider {
  readonly name = "mock"
  readonly verified = false

  async fetch(regNumber: string): Promise<unknown> {
    const reg = normalizeReg(regNumber)
    if (reg.endsWith("0000")) throw new RcError("not_found", "No RC found for this number")
    if (reg.endsWith("9999")) throw new RcError("provider_error", "Mock provider outage")
    const sum = [...reg].reduce((a, c) => a + c.charCodeAt(0), 0)
    return { rc_number: reg, ...FIXTURES[sum % FIXTURES.length] }
  }

  normalize(raw: unknown, regNumber: string): RcRecord {
    const d = raw as Record<string, unknown>
    const registrationDate = normalizeDate(d.registration_date)
    return {
      regNumber: normalizeReg(regNumber),
      makerRaw: clean(d.maker_description) ?? "",
      modelRaw: clean(d.maker_model) ?? "",
      fuel: normalizeFuel(d.fuel_type),
      manufacturingYear: yearOf(registrationDate),
      registrationDate,
      ownerCount: normalizeOwnerCount(d.owner_number),
      insuranceValidTill: normalizeDate(d.insurance_upto),
      hypothecated: toBool(d.financed),
      colour: clean(d.color),
      vehicleClass: null,
      seatingCapacity: Number(d.seat_capacity) || null,
    }
  }
}
