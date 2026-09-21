import { desc, inArray, sql } from "drizzle-orm"
import Link from "next/link"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDealerContext } from "@/lib/auth/context"
import { copy } from "@/lib/copy"
import { carMedia, cars } from "@/lib/db/schema"
import { scopedDb } from "@/lib/db/scoped"
import { HERO_ANGLE } from "@/lib/angles"
import { formatReg } from "@/lib/reg"
import { tryDecrypt } from "@/lib/crypto"
import { getStorage } from "@/lib/storage"
import { formatInr } from "@/lib/share/caption"
import { getVariantsByIds } from "@/lib/variants/repo"
import { cn } from "@/lib/utils"

export const metadata = { title: copy.admin.cars.title }
const t = copy.admin.cars

export default async function CarsPage() {
  const ctx = await getDealerContext()
  if (ctx.status !== "ok" || !ctx.dealerInDb) {
    return (
      <Alert className="max-w-lg">
        <AlertDescription>{copy.admin.dashboard.noDealerBody}</AlertDescription>
      </Alert>
    )
  }
  const db = scopedDb(ctx.dealer.id)
  const rows = await db.cars.select(undefined, { orderBy: [sql`${cars.listedAt} desc nulls last`, desc(cars.id)], limit: 100 })

  const variantIds = [...new Set(rows.map((r) => r.variantId).filter((v): v is string => !!v))]
  const variantRows = await getVariantsByIds(variantIds)
  const label = new Map(variantRows.map((v) => [v.id, `${v.make} ${v.model} ${v.variant}`]))

  const heroes = rows.length ? await db.carMedia.select(inArray(carMedia.carId, rows.map((r) => r.id))) : []
  const storage = getStorage()
  const hero = new Map(
    heroes.filter((m) => m.angle === HERO_ANGLE && (m.status === "uploaded" || m.status === "ready")).map((m) => [m.carId, storage.publicUrl(m.r2Key)]),
  )

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{t.title}</h1>
        <Link href="/cars/new" className={cn(buttonVariants())}>
          {t.add}
        </Link>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t.empty.title}</CardTitle>
            <CardDescription>{t.empty.body}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((car) => {
            const draft = car.status === "draft"
            return (
              <li key={car.id}>
                <Link href={draft ? `/cars/new?car=${car.id}` : `/cars/${car.id}`} className="block">
                  <Card size="sm" className="transition-colors hover:bg-muted/40">
                    <CardContent className="flex items-center gap-3">
                      {hero.get(car.id) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={hero.get(car.id)} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="size-16 shrink-0 rounded-lg bg-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {[car.year, car.variantId ? label.get(car.variantId) : null].filter(Boolean).join(" ") || t.untitled}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {formatReg(tryDecrypt(car.regNumber) ?? "")} · {car.askingPrice ? `₹${formatInr(car.askingPrice)}` : t.priceOnRequest}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={car.status === "live" ? "default" : "secondary"}>{t.status[car.status]}</Badge>
                        {draft && <span className="text-xs text-primary">{t.continueDraft}</span>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
