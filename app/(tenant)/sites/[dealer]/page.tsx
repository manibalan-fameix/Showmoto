import { notFound } from "next/navigation"
import { desc, eq } from "drizzle-orm"

import { copy } from "@/lib/copy"
import { cars } from "@/lib/db/schema"
import { scopedDb } from "@/lib/db/scoped"
import { getDealerBySlug } from "@/lib/tenant/dealer"

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })

// Phase 1 landing: proves theming and tenant scoping. The full buyer car page is Phase 4.
export default async function DealerHome({ params }: { params: Promise<{ dealer: string }> }) {
  const dealer = await getDealerBySlug((await params).dealer)
  if (!dealer) notFound()

  const live = await scopedDb(dealer.id).cars.select(eq(cars.status, "live"), {
    orderBy: [desc(cars.listedAt)],
  })

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center gap-3 rounded-lg bg-primary p-4 text-primary-foreground">
        {dealer.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dealer.logoUrl} alt="" className="size-12 rounded-md bg-background object-contain" />
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{dealer.displayName}</h1>
          <p className="text-sm opacity-90">{dealer.city}</p>
        </div>
      </header>

      <p className="text-sm text-muted-foreground">{copy.tenant.cars(live.length)}</p>

      {live.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="font-medium">{copy.tenant.noCars}</p>
          <p className="mt-1 text-sm text-muted-foreground">{copy.tenant.emptyHint}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {live.map((car) => (
            <li key={car.id} className="rounded-lg border border-border bg-card p-4 text-card-foreground">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">
                  {car.year} {car.regPrefix?.toUpperCase()}
                </span>
                <span className="font-semibold text-primary">
                  {car.askingPrice ? inr.format(car.askingPrice) : copy.tenant.priceOnRequest}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {[car.kmDriven != null && `${car.kmDriven.toLocaleString("en-IN")} ${copy.tenant.km}`, car.fuel, car.transmission]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      )}

      {dealer.phone && (
        <a
          href={`tel:${dealer.phone}`}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground"
        >
          {copy.tenant.call}
        </a>
      )}
    </main>
  )
}
