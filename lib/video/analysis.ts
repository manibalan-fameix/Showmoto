import { z } from "zod"

import { CAR_ANGLES, type CarAngle } from "../angles.ts"
import type { VisionClient, VisionImage } from "../ai/vision.ts"

const DESCRIPTIONS: Record<CarAngle, string> = {
  front_three_quarter: "front of the car seen from a front corner (bonnet and one side visible)",
  rear_three_quarter: "rear of the car seen from a rear corner (boot and one side visible)",
  side_left: "the car's left side, wheel to wheel",
  side_right: "the car's right side, wheel to wheel",
  dashboard: "the dashboard and steering wheel from the driver seat",
  odometer: "the instrument cluster with the odometer readable",
  front_seats: "the front seats",
  rear_seats: "the rear seat",
  boot: "the open boot / luggage area",
  engine_bay: "the open bonnet showing the engine bay",
  tyres_front: "a front tyre and wheel up close",
  tyres_rear: "a rear tyre and wheel up close",
}

const answer = z.object({ seen: z.array(z.string()) })

export type AngleAnalysis = { seen: CarAngle[]; missing: CarAngle[] }

/**
 * Which of the 12 required angles do these video frames clearly show? The frames exist only in
 * memory for this call. They are never stored and never used as listing photos: listing photos
 * always come from the dealer's own stills.
 */
export async function analyseAngles(vision: VisionClient, frames: VisionImage[]): Promise<AngleAnalysis | null> {
  if (frames.length === 0) return null
  const result = await vision.json({
    system:
      "You check a walkaround video of a used car. You are given frames sampled evenly from it. " +
      "For each required angle, decide whether at least one frame clearly shows it. Be strict: " +
      "an angle counts only if it is clearly visible, not merely implied.",
    prompt: [
      `There are ${frames.length} frames. Which of these angles are clearly shown? Answer with the ids that are.`,
      ...CAR_ANGLES.map((a) => `- ${a}: ${DESCRIPTIONS[a]}`),
    ].join("\n"),
    images: frames,
    jsonSchema: {
      type: "object",
      properties: { seen: { type: "array", items: { type: "string", enum: [...CAR_ANGLES] } } },
      required: ["seen"],
      additionalProperties: false,
    },
    validate: answer,
    maxTokens: 500,
  })
  if (!result) return null
  const seen = CAR_ANGLES.filter((a) => result.seen.includes(a)) // drops anything not on the list
  return { seen, missing: CAR_ANGLES.filter((a) => !seen.includes(a)) }
}
