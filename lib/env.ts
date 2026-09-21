/** Root domain without protocol, may include a port in dev (e.g. "localhost:3000"). */
export function getRootDomain(): string | undefined {
  return process.env.ROOT_DOMAIN?.trim() || undefined
}

function protocolFor(root: string) {
  return root.startsWith("localhost") || root.includes(".localhost") ? "http" : "https"
}

export function tenantUrl(slug: string, path = "/"): string {
  const root = getRootDomain() ?? "localhost:3000"
  return `${protocolFor(root)}://${slug}.${root}${path}`
}

export function adminUrl(path = "/"): string {
  const root = getRootDomain() ?? "localhost:3000"
  return `${protocolFor(root)}://app.${root}${path}`
}
