/** Header carrying the resolved dealer slug to route handlers. Set only by proxy.ts, never trusted from clients. */
export const TENANT_HEADER = "x-tenant-slug"

/** Subdomains that can never be a dealer slug. */
export const RESERVED_SLUGS = new Set([
  "app", "www", "api", "admin", "auth", "static", "assets", "cdn", "media", "mail", "smtp",
  "support", "help", "status", "blog", "docs", "dashboard", "login", "signup", "billing",
  "root", "test", "staging", "dev", "demo-admin",
])

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug) && !RESERVED_SLUGS.has(slug)
}

export type HostTarget =
  | { kind: "marketing" }
  | { kind: "admin" }
  | { kind: "subdomain"; slug: string }
  | { kind: "custom"; hostname: string }
  | { kind: "invalid" }

/** Lowercase, strip port and a trailing dot. */
export function normalizeHost(host: string | null | undefined): string {
  return (host ?? "").trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "")
}

export const ADMIN_SUBDOMAIN = "app"

/**
 * Decide which surface a request host belongs to.
 * `rootDomain` may include a port (e.g. "localhost:3000"); ports are ignored.
 */
export function classifyHost(hostHeader: string | null | undefined, rootDomain: string): HostTarget {
  const host = normalizeHost(hostHeader)
  const root = normalizeHost(rootDomain)
  if (!host || !root) return { kind: "invalid" }

  if (host === root || host === `www.${root}`) return { kind: "marketing" }

  if (host.endsWith(`.${root}`)) {
    const sub = host.slice(0, -(root.length + 1))
    if (sub === ADMIN_SUBDOMAIN) return { kind: "admin" }
    // Only one label deep: "a.b.root" is not a valid tenant.
    if (sub.includes(".") || !isValidSlug(sub)) return { kind: "invalid" }
    return { kind: "subdomain", slug: sub }
  }

  // Anything else is a candidate custom domain; the DB decides.
  return { kind: "custom", hostname: host }
}
