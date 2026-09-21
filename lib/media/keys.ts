export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
export const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const

export const MAX_PHOTO_BYTES = 15 * 1024 * 1024
export const MAX_VIDEO_BYTES = 400 * 1024 * 1024

const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm",
}

/**
 * Storage key for one upload attempt. Scoped under the dealer, so a key can be checked
 * against the caller's dealer id, and keyed by the client's upload id so retries reuse it.
 */
export function mediaKey(p: { dealerId: string; carId: string; kind: "photo" | "video"; angle?: string; uploadId: string; contentType: string }) {
  const name = p.kind === "photo" ? `${p.angle}-${p.uploadId}` : `video-${p.uploadId}`
  return `dealers/${p.dealerId}/cars/${p.carId}/${name}.${EXT[p.contentType] ?? "bin"}`
}

/** Derived outputs of the video worker sit beside the original. */
export function videoOutputKeys(originalKey: string) {
  const base = originalKey.replace(/\.[^.]+$/, "")
  return { hlsMaster: `${base}/hls/master.m3u8`, poster: `${base}/poster.jpg`, hlsDir: `${base}/hls` }
}
