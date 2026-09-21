// In-memory sliding window. Per server instance only: good enough to blunt abuse in v1.
// TODO(phase 6): move to a shared store if we run more than one instance.
const hits = new Map<string, number[]>()

/** Returns true if the action is allowed, and records it. */
export function allow(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= limit) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 10_000) for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k)
  return true
}
