import type { CSSProperties, ReactNode } from "react"
import { notFound } from "next/navigation"

import { PoweredBy } from "@/components/tenant/powered-by"
import { getDealerBySlug } from "@/lib/tenant/dealer"
import { themeToCssVars } from "@/lib/theme/tokens"

export async function generateMetadata({ params }: { params: Promise<{ dealer: string }> }) {
  const dealer = await getDealerBySlug((await params).dealer)
  return dealer ? { title: { default: dealer.displayName, template: `%s | ${dealer.displayName}` } } : {}
}

// Buyer surface: server-rendered, tokens only. The dealer's theme is injected as CSS custom
// properties on this wrapper, overriding the preset for this subtree. Admin never sees them.
export default async function TenantLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ dealer: string }>
}) {
  const dealer = await getDealerBySlug((await params).dealer)
  if (!dealer) notFound()

  return (
    <div
      data-tenant={dealer.slug}
      style={themeToCssVars(dealer.theme) as CSSProperties}
      className="flex min-h-svh flex-col bg-background text-foreground"
    >
      <div className="flex-1">{children}</div>
      {!dealer.whiteLabel && <PoweredBy />}
    </div>
  )
}
