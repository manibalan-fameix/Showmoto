import { NextResponse } from "next/server"

import { getDealerContext } from "@/lib/auth/context"
import { MAX_VIDEO_BYTES } from "@/lib/media/keys"
import { getStorage } from "@/lib/storage"

// Development stand-in for a presigned R2 upload. Returns 404 whenever R2 is configured or
// NODE_ENV is not "development", so it can never be reached in production.
export async function PUT(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  let storage
  try {
    storage = getStorage()
  } catch {
    return new NextResponse(null, { status: 404 })
  }
  if (storage.kind !== "local") return new NextResponse(null, { status: 404 })

  const ctx = await getDealerContext()
  if (ctx.status !== "ok" || !ctx.dealerInDb) return new NextResponse(null, { status: 401 })

  const key = (await params).key.join("/")
  // A dealer may only write under their own prefix, exactly like a presigned R2 URL.
  if (!key.startsWith(`dealers/${ctx.dealer.id}/`)) return new NextResponse(null, { status: 403 })

  const length = Number(request.headers.get("content-length") ?? 0)
  if (length > MAX_VIDEO_BYTES) return new NextResponse(null, { status: 413 })
  const body = Buffer.from(await request.arrayBuffer())
  if (body.length === 0 || body.length > MAX_VIDEO_BYTES) return new NextResponse(null, { status: 413 })

  await storage.put(key, body, request.headers.get("content-type") ?? "application/octet-stream")
  return new NextResponse(null, { status: 200 })
}
