import { z } from "zod"

import { isValidReg, normalizeReg, repairOcrReg } from "../reg"
import type { VisionClient, VisionImage } from "./vision"

const answer = z.object({ plate: z.string().nullable() })

export type PlateReading = { reg: string | null; valid: boolean; aiAvailable: boolean }

const SYSTEM =
  "You read Indian vehicle registration plates from photos. Answer only with what is legible. " +
  "If there is no plate, or you cannot read it with confidence, answer null. Never guess missing characters."

/**
 * OCR a plate photo. Always returns something the dealer can correct: `reg` is the best reading
 * (or null), `valid` says whether it fits the Indian format after fixing O/0-style confusions.
 */
export async function readPlate(vision: VisionClient | null, image: VisionImage): Promise<PlateReading> {
  if (!vision) return { reg: null, valid: false, aiAvailable: false }
  const result = await vision.json({
    system: SYSTEM,
    prompt: "Read the registration number on the plate in this photo. Return it without spaces.",
    images: [image],
    jsonSchema: {
      type: "object",
      properties: { plate: { type: ["string", "null"] } },
      required: ["plate"],
      additionalProperties: false,
    },
    validate: answer,
    maxTokens: 300,
  })
  if (!result?.plate) return { reg: null, valid: false, aiAvailable: true }
  const reg = normalizeReg(repairOcrReg(result.plate))
  return { reg, valid: isValidReg(reg), aiAvailable: true }
}
