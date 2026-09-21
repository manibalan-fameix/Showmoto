import { notFound } from "next/navigation"

import { ComingSoon } from "@/components/admin/coming-soon"
import { isPlaceholderPath } from "@/components/admin/nav-config"

// Every sidebar link resolves to something. Screens that are not built yet land here.
// Unknown paths still 404. Real routes (e.g. /dashboard) take precedence over this catch-all.
export default async function Placeholder({ params }: { params: Promise<{ slug: string[] }> }) {
  const path = `/${(await params).slug.join("/")}`
  if (!isPlaceholderPath(path)) notFound()
  return <ComingSoon path={path} />
}
