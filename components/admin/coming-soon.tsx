import { pageTitleFor } from "@/components/admin/nav-config"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { copy } from "@/lib/copy"

export function ComingSoon({ path }: { path: string }) {
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
