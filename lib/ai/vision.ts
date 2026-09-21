import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"

export type VisionImage = { mediaType: "image/jpeg" | "image/png" | "image/webp"; base64: string }

export type VisionRequest<T> = {
  system: string
  prompt: string
  images?: VisionImage[]
  /** JSON Schema the model's answer must follow (structured outputs). */
  jsonSchema: Record<string, unknown>
  /** Zod validation of the parsed answer; the model's output is never trusted as-is. */
  validate: z.ZodType<T>
  maxTokens?: number
}

/** One narrow capability: ask a vision model a question, get validated JSON or null. Never throws. */
export interface VisionClient {
  json<T>(req: VisionRequest<T>): Promise<T | null>
}

/** Default model. Override with VISION_MODEL (e.g. a cheaper, faster one for plate reading). */
export const DEFAULT_VISION_MODEL = "claude-opus-5"

export function createAnthropicVision(client: Anthropic, model: string): VisionClient {
  return {
    async json<T>(req: VisionRequest<T>): Promise<T | null> {
      try {
        const content: Anthropic.ContentBlockParam[] = [
          ...(req.images ?? []).map(
            (img): Anthropic.ImageBlockParam => ({
              type: "image",
              source: { type: "base64", media_type: img.mediaType, data: img.base64 },
            }),
          ),
          { type: "text", text: req.prompt },
        ]
        const response = await client.messages.create({
          model,
          max_tokens: req.maxTokens ?? 2000,
          system: req.system,
          // Low effort: these are short extraction and ranking tasks on the dealer's critical path.
          output_config: { effort: "low", format: { type: "json_schema", schema: req.jsonSchema } },
          messages: [{ role: "user", content }],
        })
        // A safety refusal or a truncated answer is treated as "no answer", not an error.
        if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") return null
        const text = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text
        if (!text) return null
        const parsed = req.validate.safeParse(JSON.parse(text))
        return parsed.success ? parsed.data : null
      } catch (error) {
        // Never log request content: it can contain plates and images.
        const status = error instanceof Anthropic.APIError ? error.status : "unknown"
        console.error(`vision call failed (status ${status})`)
        return null
      }
    },
  }
}

/** Null when VISION_API_KEY is not set: callers fall back to manual entry / rules only. */
export function getVisionClient(env: Record<string, string | undefined> = process.env): VisionClient | null {
  if (!env.VISION_API_KEY) return null
  return createAnthropicVision(new Anthropic({ apiKey: env.VISION_API_KEY }), env.VISION_MODEL ?? DEFAULT_VISION_MODEL)
}
