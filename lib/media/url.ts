export type ImageOptions = { width?: number; height?: number; fit?: "cover" | "contain" | "scale-down"; quality?: number }

/**
 * Image URL for a public storage URL. With R2 behind a Cloudflare zone that has Image Resizing on,
 * this returns a /cdn-cgi/image/ URL so the edge serves right-sized WebP/AVIF. For local
 * development (relative URLs) the original is returned as-is.
 */
export function imageUrl(publicUrl: string, opts: ImageOptions = {}): string {
  if (!/^https?:\/\//.test(publicUrl)) return publicUrl
  const u = new URL(publicUrl)
  const parts = [
    opts.width && `width=${Math.round(opts.width)}`,
    opts.height && `height=${Math.round(opts.height)}`,
    opts.fit && `fit=${opts.fit}`,
    `quality=${opts.quality ?? 80}`,
    "format=auto",
  ].filter(Boolean)
  return `${u.origin}/cdn-cgi/image/${parts.join(",")}${u.pathname}`
}
