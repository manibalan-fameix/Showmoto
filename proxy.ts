import { NextResponse, type NextRequest } from "next/server"

import { getRootDomain } from "./lib/env"
import { looksLikeShortCode } from "./lib/slug"
import { TENANT_HEADER, classifyHost } from "./lib/tenant/host"
import { resolveCustomDomain, resolveShortCode } from "./lib/tenant/lookup"

const notFound = () => new NextResponse("Not found", { status: 404 })

/**
 * Tenant resolution (Next 16 "proxy", formerly middleware).
 *   <slug>.<root>      -> /sites/<slug>/...   (app/(tenant)/sites/[dealer])
 *   verified custom    -> /sites/<slug>/...
 *   app.<root>         -> admin routes as-is
 *   <root>, www.<root> -> marketing page only
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /sites/* exists only as a rewrite target. A direct hit would bypass host resolution.
  if (pathname === "/sites" || pathname.startsWith("/sites/")) return notFound()

  const root = getRootDomain()
  if (!root) return NextResponse.next() // unconfigured (e.g. first run): no tenant routing

  const headers = new Headers(request.headers)
  headers.delete(TENANT_HEADER) // never trust a client-supplied tenant

  const target = classifyHost(request.headers.get("host"), root)

  switch (target.kind) {
    case "invalid":
      return notFound()

    case "marketing":
      if (pathname === "/" || pathname === "/privacy" || pathname === "/terms") return NextResponse.next()
      // Dev only: also serve admin on the bare root (http://localhost:3000/login), because
      // Google OAuth reliably accepts http://localhost redirect URIs but not app.localhost.
      if (process.env.NODE_ENV === "development") return NextResponse.next({ request: { headers } })
      return notFound()

    case "admin":
      if (pathname === "/") return NextResponse.redirect(new URL("/dashboard", request.url))
      return NextResponse.next({ request: { headers } })

    case "subdomain":
    case "custom": {
      const slug = target.kind === "subdomain" ? target.slug : await resolveCustomDomain(target.hostname)
      if (!slug) return notFound()
      headers.set(TENANT_HEADER, slug)

      // Public tenant endpoints (leads, views) resolve the dealer from the header.
      if (pathname.startsWith("/api/t/")) return NextResponse.next({ request: { headers } })
      if (pathname.startsWith("/api/")) return notFound()

      const url = request.nextUrl.clone()

      // Short share link: /k7x2m -> 301 to the canonical car URL (query string, e.g. UTM, is kept).
      const segment = pathname.slice(1)
      if (looksLikeShortCode(segment)) {
        const carSlug = await resolveShortCode(slug, segment)
        if (carSlug) {
          url.pathname = `/${carSlug}`
          return NextResponse.redirect(url, 301)
        }
      }

      url.pathname = `/sites/${slug}${pathname === "/" ? "" : pathname}`
      return NextResponse.rewrite(url, { request: { headers } })
    }
  }
}

export const config = {
  // Skip Next internals and static files (anything with an extension).
  matcher: ["/((?!_next/|.*\\.[a-zA-Z0-9]+$).*)"],
}
