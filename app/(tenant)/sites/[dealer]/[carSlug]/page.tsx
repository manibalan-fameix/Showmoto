import { and, eq } from "drizzle-orm"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { HERO_ANGLE } from "@/lib/angles"
import { copy } from "@/lib/copy"
import { carMedia, cars } from "@/lib/db/schema"
import { scopedDb } from "@/lib/db/scoped"
import { formatInr } from "@/lib/share/caption"
import { getStorage } from "@/lib/storage"
import { getDealerBySlug } from "@/lib/tenant/dealer"
import { getVariantById } from "@/lib/variants/repo"

const t = copy.tenant

async function load(dealerSlug: string, carSlug: string) {
  const dealer = await getDealerBySlug(dealerSlug)
  if (!dealer) return null
  const db = scopedDb(dealer.id)
  const [car] = await db.cars.select(eq(cars.slug, carSlug), { limit: 1 })
  // Buyers only ever see published cars.
  if (!car || car.status === "draft" || car.status === "archived") return null
  const variant = car.variantId ? await getVariantById(car.variantId) : null
  const [hero] = await db.carMedia.select(and(eq(carMedia.carId, car.id), eq(carMedia.angle, HERO_ANGLE), eq(carMedia.kind, "photo")), { limit: 1 })
  return { dealer, car, variant, heroUrl: hero ? getStorage().publicUrl(hero.r2Key) : null }
}

const titleOf = (year: number | null, v: { make: string; model: string; variant: string } | null) =>
  [year, v && `${v.make} ${v.model} ${v.variant}`].filter(Boolean).join(" ")

export async function generateMetadata({ params }: { params: Promise<{ dealer: string; carSlug: string }> }): Promise<Metadata> {
  const { dealer, carSlug } = await params
  const data = await load(dealer, carSlug)
  return data ? { title: titleOf(data.car.year, data.variant) } : {}
}

// Basic car page so a shared link lands somewhere real. The full buyer page (gallery, specs,
// EMI, lead capture, Open Graph tags) is Phase 4. The plate, owner details and RC data are
// never selected here: only the fields below reach the browser.
export default async function CarPage({ params }: { params: Promise<{ dealer: string; carSlug: string }> }) {
  const { dealer: dealerSlug, carSlug } = await params
  const data = await load(dealerSlug, carSlug)
  if (!data) notFound()
  const { dealer, car, variant, heroUrl } = data

  const facts = [
    car.year,
    car.kmDriven != null ? `${formatInr(car.kmDriven)} ${t.km}` : null,
    car.fuel,
    car.transmission,
    car.ownerCount ? t.car.owners(car.ownerCount) : null,
  ].filter(Boolean)

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 sm:p-6">
      <header className="flex items-center gap-2">
        <span className="truncate text-sm font-medium text-muted-foreground">{dealer.displayName}</span>
      </header>

      {heroUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={heroUrl} alt={titleOf(car.year, variant)} className="aspect-[4/3] w-full rounded-lg bg-muted object-cover" />
      ) : (
        <div className="aspect-[4/3] w-full rounded-lg bg-muted" />
      )}

      <div>
        <h1 className="text-2xl font-semibold">{titleOf(car.year, variant)}</h1>
        <p className="mt-1 text-2xl font-semibold text-primary">{car.askingPrice ? `₹${formatInr(car.askingPrice)}` : t.priceOnRequest}</p>
      </div>

      {car.status !== "live" && (
        <p className="rounded-lg bg-muted p-3 text-sm">{car.status === "sold" ? t.car.sold : t.car.onHold}</p>
      )}

      <ul className="flex flex-wrap gap-2 text-sm">
        {facts.map((f) => (
          <li key={String(f)} className="rounded-full border border-border px-3 py-1">
            {f}
          </li>
        ))}
        {car.rcVerifiedAt && <li className="rounded-full bg-primary px-3 py-1 text-primary-foreground">{t.car.verified}</li>}
      </ul>

      <p className="text-sm text-muted-foreground">{t.car.previewNote}</p>

      {dealer.phone && (
        <a href={`tel:${dealer.phone}`} className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground">
          {t.car.contact}
        </a>
      )}
    </main>
  )
}
