export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\+/g, "-plus-")
    .replace(/\(o\)/g, "-o-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Canonical car path segment: 2017-maruti-baleno-alpha-tn11 (first word of the make, as in the brief). */
export function carSlug(p: { year: number; make: string; model: string; variant: string; regPrefix: string }): string {
  return slugify([p.year, p.make.split(/\s+/)[0], p.model, p.variant, p.regPrefix].filter(Boolean).join(" "))
}

/** First free slug: base, base-2, base-3 ... */
export function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`
}

// Short share codes are 5 to 6 characters with no hyphen; canonical slugs always contain hyphens.
export const SHORT_CODE_RE = /^[23456789a-hjkmnp-z]{5,6}$/
export const looksLikeShortCode = (segment: string) => SHORT_CODE_RE.test(segment)
