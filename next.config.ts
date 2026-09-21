import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // The e2e run uses its own build dir so it never fights a dev server you already have open.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  experimental: {
    // Plate photos travel to the OCR action as base64. Photos and video go straight to storage.
    serverActions: { bodySizeLimit: "2mb" },
  },
}

export default nextConfig
