import { encrypt } from "../crypto/index.ts"
import { cars } from "../db/schema/index.ts"
import { scopedDb } from "../db/scoped.ts"
import { isValidReg, normalizeReg, regPrefix } from "../reg.ts"
import { generateShortCode } from "../short-code.ts"

const isUniqueViolation = (e: unknown) => (e as { cause?: { code?: string } })?.cause?.code === "23505"

export class InvalidRegError extends Error {}

/** A draft car from a registration number. The plate is encrypted at rest; the short code is unique. */
export async function createDraftCar(dealerId: string, reg: string): Promise<string> {
  if (!isValidReg(reg)) throw new InvalidRegError("Registration number looks wrong")
  const normalized = normalizeReg(reg)
  const db = scopedDb(dealerId)

  for (let attempt = 0; attempt < 6; attempt++) {
    const shortCode = generateShortCode(attempt < 3 ? 5 : 6)
    try {
      const [row] = await db.cars
        .insert({
          regNumber: encrypt(normalized),
          regPrefix: regPrefix(normalized),
          status: "draft",
          shortCode,
          slug: `draft-${shortCode}`,
        })
        .returning({ id: cars.id })
      return row.id
    } catch (e) {
      if (!isUniqueViolation(e)) throw e
    }
  }
  throw new Error("Could not allocate a short code")
}
