import { notFound } from "next/navigation"

import { isPlaceholderPath, pageTitleFor } from "@/components/admin/nav-config"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { copy } from "@/lib/copy"

// Every sidebar link resolves to something. Screens that are not built yet land here.
// Unknown paths still 404. Real routes (e.g. /dashboard) take precedence over this catch-all.
export default async function ComingSoon({ params }: { params: Promise<{ slug: string[] }> }) {
  const path = `/${(await params).slug.join("/")}`
  if (!isPlaceholderPath(path)) notFound()

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardDescription>{pageTitleFor(path)}</CardDescription>
        <CardTitle>{copy.admin.comingSoon.title}</CardTitle>
        <CardDescription>{copy.admin.comingSoon.body}</CardDescription>
      </CardHeader>
    </Card>
  )
}
