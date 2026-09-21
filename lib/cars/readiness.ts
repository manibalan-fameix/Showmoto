// Pure, client-safe helpers (no server imports), shared by the server and the wizard.
import { HERO_ANGLE } from "../angles.ts"

type Landable = { status: "pending" | "uploaded" | "processing" | "ready" | "failed" }

/** True when a photo has landed in storage: publishing only needs the hero to reach this point. */
export const isLanded = (m: Landable) => m.status === "uploaded" || m.status === "ready"

export type Readiness = { ready: boolean; missing: ("variant" | "year" | "hero")[] }

export function publishReadiness(s: {
  variant: unknown | null
  year: number | null
  media: (Landable & { kind: "photo" | "video"; angle: string | null })[]
}): Readiness {
  const missing: Readiness["missing"] = []
  if (!s.variant) missing.push("variant")
  if (!s.year) missing.push("year")
  if (!s.media.some((m) => m.kind === "photo" && m.angle === HERO_ANGLE && isLanded(m))) missing.push("hero")
  return { ready: missing.length === 0, missing }
}
