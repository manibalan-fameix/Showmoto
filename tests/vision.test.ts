import type Anthropic from "@anthropic-ai/sdk"
import { describe, expect, it, vi } from "vitest"
import { z } from "zod"

import { readPlate } from "../lib/ai/plate"
import { createAnthropicVision, getVisionClient } from "../lib/ai/vision"

const schema = z.object({ plate: z.string().nullable() })
const req = { system: "s", prompt: "p", jsonSchema: {}, validate: schema }
const fakeSdk = (create: (args: unknown) => unknown) => ({ messages: { create: vi.fn(create) } }) as unknown as Anthropic
const text = (t: string, stop = "end_turn") => ({ stop_reason: stop, content: [{ type: "text", text: t }] })

describe("vision client", () => {
  it("returns validated JSON and sends images as base64 blocks", async () => {
    const sdk = fakeSdk(() => text('{"plate":"TN11AB1234"}'))
    const v = createAnthropicVision(sdk, "test-model")
    const out = await v.json({ ...req, images: [{ mediaType: "image/jpeg", base64: "AAAA" }] })
    expect(out).toEqual({ plate: "TN11AB1234" })
    const args = (sdk.messages.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(args.model).toBe("test-model")
    expect(args.messages[0].content[0]).toMatchObject({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: "AAAA" } })
    expect(args.output_config.format.type).toBe("json_schema")
  })
  it("returns null for schema violations, non-JSON, refusals, truncation and empty output", async () => {
    for (const reply of [text('{"nope":1}'), text("not json"), text('{"plate":"X"}', "refusal"), text('{"plate":"X"}', "max_tokens"), { stop_reason: "end_turn", content: [] }]) {
      expect(await createAnthropicVision(fakeSdk(() => reply), "m").json(req)).toBeNull()
    }
  })
  it("returns null instead of throwing when the API call fails, and does not log the prompt", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    const v = createAnthropicVision(fakeSdk(() => { throw new Error("boom TN11AB1234") }), "m")
    expect(await v.json({ ...req, prompt: "secret plate TN11AB1234" })).toBeNull()
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/TN11AB1234|secret/)
    log.mockRestore()
  })
  it("is disabled without VISION_API_KEY", () => {
    expect(getVisionClient({})).toBeNull()
    expect(getVisionClient({ VISION_API_KEY: "k" })).not.toBeNull()
  })
})

describe("plate reading", () => {
  const image = { mediaType: "image/jpeg" as const, base64: "AAAA" }
  const client = (plate: string | null) => ({ json: vi.fn(async () => ({ plate })) }) as never

  it("repairs OCR confusions and validates", async () => {
    expect(await readPlate(client("TNl1 AB l234"), image)).toEqual({ reg: "TN11AB1234", valid: true, aiAvailable: true })
  })
  it("still returns an unusable reading so the dealer can correct it", async () => {
    expect(await readPlate(client("XYZ"), image)).toEqual({ reg: "XYZ", valid: false, aiAvailable: true })
  })
  it("returns null when nothing is legible or the model fails", async () => {
    expect((await readPlate(client(null), image)).reg).toBeNull()
    expect((await readPlate({ json: vi.fn(async () => null) } as never, image)).reg).toBeNull()
  })
  it("degrades to manual entry with no vision client", async () => {
    expect(await readPlate(null, image)).toEqual({ reg: null, valid: false, aiAvailable: false })
  })
})
