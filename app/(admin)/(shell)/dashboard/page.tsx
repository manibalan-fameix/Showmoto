import { eq } from "drizzle-orm"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { copy } from "@/lib/copy"
import { cars } from "@/lib/db/schema"
import { scopedDb } from "@/lib/db/scoped"
import { getDealerContext } from "@/lib/auth/context"
import { tenantUrl } from "@/lib/env"
import { cn } from "@/lib/utils"

export const metadata = { title: copy.admin.dashboard.title }

export default async function DashboardPage() {
  const ctx = await getDealerContext()

  if (ctx.status !== "ok") {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{copy.admin.dashboard.noDealerTitle}</CardTitle>
          <CardDescription>{copy.admin.dashboard.noDealerBody}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { dealer, plan } = ctx
  const live = !ctx.dealerInDb ? [] : await scopedDb(dealer.id).cars.select(eq(cars.status, "live"))
  const publicUrl = tenantUrl(dealer.slug)

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <h1 className="text-xl font-semibold">{copy.admin.dashboard.welcome(dealer.displayName)}</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>{copy.admin.dashboard.liveCars}</CardDescription>
            <CardTitle className="text-2xl">{copy.admin.dashboard.capUsage(live.length, plan.maxLiveCars)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{copy.admin.dashboard.plan}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              {plan.label}
              <Badge variant="secondary">{ctx.role}</Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>{copy.admin.dashboard.publicPage}</CardDescription>
          <CardTitle className="break-all text-base font-medium">{publicUrl}</CardTitle>
        </CardHeader>
        <CardContent>
          <a href={publicUrl} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline" }))}>
            {copy.admin.dashboard.openPage}
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
