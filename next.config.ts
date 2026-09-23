import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // The e2e run uses its own build dir so it never fights a dev server you already have open.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // The dev badge floats over the bottom-left corner, where the camera's Skip button sits.
  ...(process.env.E2E === "1" ? { devIndicators: false as const } : {}),
  // The Cloudflare (workerd) bundle resolves pg's socket shim through this condition; tracing
  // would otherwise keep only the empty Node stub and the bundle step fails.
  outputFileTracingIncludes: { "/*": ["./node_modules/pg-cloudflare/**/*"] },
  experimental: {
    // Plate photos travel to the OCR action as base64. Photos and video go straight to storage.
    serverActions: { bodySizeLimit: "2mb" },
  },
}

export default nextConfig
