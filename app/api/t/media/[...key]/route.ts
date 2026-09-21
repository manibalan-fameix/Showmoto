import { NextResponse } from "next/server"

import { getStorage } from "@/lib/storage"

const TYPES: Record<string, string> = {
  jpg: "image/jpeg", png: "image/png", webp: "image/webp",
  mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm",
  m3u8: "application/vnd.apple.mpegurl", ts: "video/mp2t",
}

// Development media server for the local storage adapter. In production, media is served by R2
// behind Cloudflare, so this returns 404 and is never used.
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  let storage
  try {
    storage = getStorage()
  } catch {
    return new NextResponse(null, { status: 404 })
  }
  if (storage.kind !== "local") return new NextResponse(null, { status: 404 })

  const key = (await params).key.join("/")
  if (!key.startsWith("dealers/")) return new NextResponse(null, { status: 404 })
  try {
    const body = await storage.get(key)
    const ext = key.split(".").pop() ?? ""
    return new NextResponse(new Uint8Array(body), {
      headers: { "Content-Type": TYPES[ext] ?? "application/octet-stream", "Cache-Control": "private, max-age=30" },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
