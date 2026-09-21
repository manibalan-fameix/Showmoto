import { MockRcProvider } from "./mock"
import { SurepassRcProvider } from "./surepass"
import type { RcRecord } from "./types"

export interface RcProvider {
  /** Stored with each cached lookup; a cache entry from another provider is ignored. */
  readonly name: string
  /** false for the mock: its data must never earn the "Verified from RTO records" badge. */
  readonly verified: boolean
  /** Call the provider. Returns the raw response (cached encrypted) or throws RcError. */
  fetch(regNumber: string): Promise<unknown>
  /** Map a raw response to our RcRecord, dropping personal fields. */
  normalize(raw: unknown, regNumber: string): RcRecord
}

/** RC_PROVIDER=mock (default) | surepass. RC_API_KEY is required for real providers. */
export function getRcProvider(env: Record<string, string | undefined> = process.env): RcProvider {
  const name = (env.RC_PROVIDER ?? "mock").toLowerCase()
  if (name === "mock") return new MockRcProvider()
  if (name === "surepass") return new SurepassRcProvider({ apiKey: env.RC_API_KEY, baseUrl: env.RC_BASE_URL })
  throw new Error(`Unknown RC_PROVIDER "${name}". Use "mock" or "surepass".`)
}
