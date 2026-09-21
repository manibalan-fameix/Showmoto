import { describe, expect, it } from "vitest"

import { backoffMs, PermanentUploadError, UploadQueue, type UploadItem, type UploadStore, type UploadTransport } from "../lib/upload/queue"

class MemoryStore implements UploadStore {
  data = new Map<string, UploadItem>()
  async put(i: UploadItem) { this.data.set(i.id, structuredClone({ ...i, blob: i.blob ? "blob" : null }) as never) }
  async delete(id: string) { this.data.delete(id) }
  async all() { return [...this.data.values()].map((i) => ({ ...i, blob: i.blob ? new Blob(["x"]) : null })) }
}

const blob = () => new Blob(["x"])
const photo = (id: string, angle: UploadItem["angle"], carId = "car1") =>
  ({ id, carId, kind: "photo" as const, angle, contentType: "image/jpeg", blob: blob() })

function setup(over: Partial<UploadTransport> = {}) {
  const log: string[] = []
  let clock = 1_000_000
  const transport: UploadTransport = {
    request: async (i) => { log.push(`request:${i.id}`); return { url: "u", method: "PUT", headers: {}, mediaId: `m-${i.id}` } },
    send: async () => { log.push("send") },
    confirm: async (i) => { log.push(`confirm:${i.id}`) },
    ...over,
  }
  const store = new MemoryStore()
  const q = new UploadQueue(store, transport, () => clock)
  return { q, store, log, advance: (ms: number) => (clock += ms) }
}

describe("upload queue", () => {
  it("uploads hero first, other angles in capture order, video last", async () => {
    const { q, log } = setup()
    await q.enqueue({ id: "vid", carId: "car1", kind: "video", contentType: "video/mp4", blob: blob() })
    await q.enqueue(photo("dash", "dashboard"))
    await q.enqueue(photo("hero", "front_three_quarter"))
    await q.enqueue(photo("rear", "rear_three_quarter"))
    await q.runUntilIdle()
    expect(log.filter((l) => l.startsWith("confirm"))).toEqual(["confirm:hero", "confirm:rear", "confirm:dash", "confirm:vid"])
  })

  it("reports progress as 'n of total' and drops the blob when done", async () => {
    const { q } = setup()
    await q.enqueue(photo("a", "front_three_quarter"))
    await q.enqueue(photo("b", "rear_three_quarter"))
    expect(q.progress("car1")).toMatchObject({ total: 2, done: 0, queued: 2 })
    await q.tick()
    expect(q.progress("car1")).toMatchObject({ done: 1, queued: 1 })
    expect(q.list("car1").find((i) => i.id === "a")!.blob).toBeNull()
  })

  it("keeps cars separate", async () => {
    const { q } = setup()
    await q.enqueue(photo("a", "front_three_quarter", "car1"))
    await q.enqueue(photo("b", "front_three_quarter", "car2"))
    expect(q.progress("car1").total).toBe(1)
    expect(q.list("car2")).toHaveLength(1)
  })

  it("retries network failures with exponential backoff and then succeeds", async () => {
    let fails = 2
    const { q, advance, log } = setup({ send: async () => { if (fails-- > 0) throw new Error("offline") } })
    await q.enqueue(photo("a", "front_three_quarter"))
    await q.tick()
    expect(q.list()[0]).toMatchObject({ state: "queued", attempts: 1, error: "offline" })
    expect(await q.tick()).toBe(false) // not due yet
    advance(backoffMs(1))
    await q.tick()
    expect(q.list()[0]).toMatchObject({ state: "queued", attempts: 2 })
    advance(backoffMs(2))
    await q.tick()
    expect(q.list()[0].state).toBe("done")
    expect(log.filter((l) => l === "confirm:a")).toHaveLength(1)
  })

  it("re-requests the same slot on retry (idempotent by item id)", async () => {
    let fails = 1
    const { q, advance, log } = setup({ confirm: async () => { if (fails-- > 0) throw new Error("timeout") } })
    await q.enqueue(photo("a", "front_three_quarter"))
    await q.tick()
    advance(backoffMs(1))
    await q.tick()
    expect(log.filter((l) => l.startsWith("request"))).toEqual(["request:a", "request:a"])
  })

  it("marks permanent errors failed immediately, and 'Retry' requeues them", async () => {
    let bad = true
    const { q } = setup({ request: async () => { if (bad) throw new PermanentUploadError("file too large"); return { url: "u", method: "PUT", headers: {}, mediaId: "m" } } })
    await q.enqueue(photo("a", "front_three_quarter"))
    await q.tick()
    expect(q.list()[0]).toMatchObject({ state: "failed", error: "file too large" })
    expect(await q.tick()).toBe(false)
    bad = false
    await q.retryFailed()
    await q.runUntilIdle()
    expect(q.list()[0].state).toBe("done")
  })

  it("gives up after too many transient failures", async () => {
    const { q, advance } = setup({ send: async () => { throw new Error("offline") } })
    await q.enqueue(photo("a", "front_three_quarter"))
    for (let i = 0; i < 10; i++) { await q.tick(); advance(120_000) }
    expect(q.list()[0].state).toBe("failed")
  })

  it("a retake replaces the waiting photo for that angle", async () => {
    const { q, log } = setup()
    await q.enqueue(photo("old", "dashboard"))
    await q.enqueue(photo("new", "dashboard"))
    await q.runUntilIdle()
    expect(log.filter((l) => l.startsWith("confirm"))).toEqual(["confirm:new"])
  })

  it("survives a restart: queued items reload, and a mid-upload crash goes back in line", async () => {
    const { q, store } = setup({ send: async () => { throw new Error("app killed") } })
    await q.enqueue(photo("a", "front_three_quarter"))
    await q.enqueue(photo("b", "rear_three_quarter"))
    await q.tick()
    // Simulate a hard kill while "b" was mid-upload.
    await store.put({ ...(await store.all()).find((i) => i.id === "b")!, state: "uploading" })

    const { log, ...fresh } = setup()
    const q2 = new UploadQueue(store, { request: async (i) => { log.push(i.id); return { url: "u", method: "PUT", headers: {}, mediaId: "m" } }, send: async () => {}, confirm: async () => {} }, () => 9_999_999)
    await q2.load()
    expect(q2.list().find((i) => i.id === "b")!.state).toBe("queued")
    await q2.runUntilIdle()
    expect(q2.progress("car1").done).toBe(2)
    void fresh
  })

  it("notifies subscribers on every change", async () => {
    const { q } = setup()
    let n = 0
    q.subscribe(() => n++)
    await q.enqueue(photo("a", "front_three_quarter"))
    await q.tick()
    expect(n).toBeGreaterThanOrEqual(3)
  })

  it("nextWakeMs tells the runner when to wake up", async () => {
    const { q } = setup({ send: async () => { throw new Error("x") } })
    expect(q.nextWakeMs()).toBeNull()
    await q.enqueue(photo("a", "front_three_quarter"))
    expect(q.nextWakeMs()).toBe(0)
    await q.tick()
    expect(q.nextWakeMs()).toBe(backoffMs(1))
  })
})
