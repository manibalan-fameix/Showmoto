import { and, eq } from "drizzle-orm"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { HERO_ANGLE } from "@/lib/angles"
import { BuyerBottomBar } from "@/components/cars/buyer-bottom-bar"
import { BuyerGallery } from "@/components/cars/buyer-gallery"
import { BuyerHeaderCard } from "@/components/cars/buyer-header-card"
import { BuyerPurchasePanel } from "@/components/cars/buyer-purchase-panel"
import { ChatWidget } from "@/components/chat/chat-widget"
import { SiteHeader } from "@/components/tenant/site-header"
import { isChatEnabled } from "@/lib/ai/chat"
import { copy } from "@/lib/copy"
import { titleOf } from "@/lib/cars/title"
import { carMedia, cars } from "@/lib/db/schema"
import { scopedDb } from "@/lib/db/scoped"
import {
  emptyMarketplaceDetails,
  marketplaceDetailsSchema,
} from "@/lib/cars/marketplace"
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
  const media = await db.carMedia.select(
    and(eq(carMedia.carId, car.id), eq(carMedia.kind, "photo")),
    { limit: 8 }
  )
  const storage = getStorage()
  const hero = media.find((m) => m.angle === HERO_ANGLE) ?? media[0]
  return {
    dealer,
    car,
    variant,
    media,
    heroUrl: hero ? storage.publicUrl(hero.r2Key) : null,
    storage,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dealer: string; carSlug: string }>
}): Promise<Metadata> {
  const { dealer, carSlug } = await params
  const data = await load(dealer, carSlug)
  return data ? { title: titleOf(data.car.year, data.variant) } : {}
}

const specLabel: Record<string, string> = {
  engineCc: "Engine",
  bootSpace: "Boot space",
  seatingCapacity: "Seating",
  mileage: "Mileage",
  groundClearance: "Ground clearance",
}

// Full buyer page. Registration number and private RC response data stay server-only.
export default async function CarPage({
  params,
}: {
  params: Promise<{ dealer: string; carSlug: string }>
}) {
  const { dealer: dealerSlug, carSlug } = await params
  const data = await load(dealerSlug, carSlug)
  if (!data) notFound()
  const { dealer, car, variant, media, storage } = data
  const details = marketplaceDetailsSchema
    .catch(emptyMarketplaceDetails())
    .parse(car.marketplaceDetails ?? {})
  const title = titleOf(car.year, variant)
  const gallery = media.map((m) => ({
    url: storage.publicUrl(m.r2Key),
    angle: m.angle,
  }))
  const featureGroups = Object.entries(details.features)
    .filter(([, items]) => items.length > 0)
    .map(([group, items]) => ({ group, items }))
  const specs = {
    ...(variant?.engineCc ? { engineCc: `${variant.engineCc} cc` } : {}),
    ...details.specs,
  }
  const specEntries = Object.entries(specs)
    .filter(([, value]) => String(value).trim() !== "")
    .map(([key, value]) => ({
      label: specLabel[key] ?? key,
      value: String(value),
    }))

  const overview = [
    {
      label: "Make year",
      value: details.overview.makeYear ?? (car.year ? String(car.year) : null),
    },
    {
      label: "Registration year",
      value: details.overview.registrationYear ?? null,
    },
    { label: "Fuel type", value: car.fuel },
    {
      label: "KM driven",
      value: car.kmDriven != null ? `${formatInr(car.kmDriven)} km` : null,
    },
    { label: "Transmission", value: car.transmission },
    {
      label: "Owner",
      value: car.ownerCount ? t.car.owners(car.ownerCount) : null,
    },
    { label: "Insurance validity", value: car.insuranceValidTill },
    { label: "Insurance type", value: details.overview.insuranceType ?? null },
    { label: "RTO", value: details.overview.rto ?? null },
    { label: "Location", value: details.overview.location ?? null },
    { label: "Colour", value: car.colour },
    { label: "Body type", value: details.overview.bodyType ?? null },
  ].filter((item): item is { label: string; value: string } =>
    Boolean(item.value)
  )

  const inspection = [
    {
      label: "Inspection score",
      value: details.trust.inspectionScore
        ? `${details.trust.inspectionScore} points`
        : null,
    },
    {
      label: "Inspection note",
      value: details.trust.inspectionSummary ?? null,
    },
    {
      label: "Warranty",
      value: details.trust.warrantyAvailable ? "Available" : null,
    },
    { label: "Service history", value: details.trust.serviceHistory ?? null },
    { label: "Accident history", value: details.trust.accidentHistory ?? null },
    {
      label: "Flood affected",
      value: details.trust.floodAffected ? "Yes" : "No",
    },
  ].filter((item): item is { label: string; value: string } =>
    Boolean(item.value)
  )

  const condition = [
    { label: "Dent/scratch notes", value: details.condition.dentNotes ?? null },
    { label: "Exterior notes", value: details.condition.exteriorNotes ?? null },
    { label: "Tyres", value: details.condition.tyreCondition ?? null },
    { label: "Battery", value: details.condition.batteryCondition ?? null },
    ...details.condition.panelIssues.map((item) => ({
      label: item.panel,
      value: item.issue,
    })),
  ].filter((item): item is { label: string; value: string } =>
    Boolean(item.value)
  )

  const coreFacts = [
    car.kmDriven != null ? `${formatInr(car.kmDriven)} km` : null,
    car.fuel,
    car.transmission,
  ].filter((value): value is string => Boolean(value))

  const headerFacts = [
    car.kmDriven != null ? `${formatInr(car.kmDriven)} km` : null,
    car.ownerCount ? t.car.owners(car.ownerCount) : null,
    car.transmission,
    car.fuel,
    details.overview.rto ?? null,
  ].filter((value): value is string => Boolean(value))

  return (
    <>
      <SiteHeader dealer={dealer} />
      <main className="min-h-svh items-start bg-background pt-[4.5rem] pb-24 lg:grid lg:grid-cols-[minmax(0,1fr)_40rem] lg:pt-20">
        <section className="sticky top-[4.5rem] z-30 flex flex-col overflow-y-auto bg-background pt-6 pb-7 lg:top-20 lg:h-[calc(100svh-5rem)] lg:pb-7">
          <div className="w-full px-4 lg:px-8">
            <BuyerGallery photos={gallery} title={title} />
          </div>
        </section>

        <div className="bg-background px-4 pt-6 pb-10 sm:px-6 lg:px-8 lg:pt-8">
          <div className="mb-6">
            <BuyerHeaderCard
              title={title}
              facts={headerFacts}
              location={details.overview.location ?? null}
              dealerPhone={dealer.phone}
              price={car.askingPrice}
              pricing={{
                loanAmount: details.pricing.loanAmount ?? null,
                downPayment: details.pricing.downPayment ?? null,
                loanDurationMonths: details.pricing.loanDurationMonths ?? null,
                interestRate: details.pricing.interestRate ?? null,
                bookingAmount: details.pricing.bookingAmount ?? null,
                tokenRefundable: details.pricing.tokenRefundable,
              }}
            />
          </div>
          <BuyerPurchasePanel
            overview={overview}
            reasons={details.trust.reasonsToBuy}
            inspection={inspection}
            protectionPlans={details.protectionPlans}
            condition={condition}
            specs={specEntries}
            featureGroups={featureGroups}
          />
        </div>
        <BuyerBottomBar
          title={title}
          facts={coreFacts}
          price={car.askingPrice}
          dealerPhone={dealer.phone}
        />
        {/* TEMP: forced on for a no-API-key UI preview — revert to `isChatEnabled()` */}
        {true || isChatEnabled() ? (
          <ChatWidget
            scope={{ type: "car", carSlug }}
            greeting={t.chat.carGreeting}
            questions={t.chat.carQuestions}
          />
        ) : null}
      </main>
    </>
  )
}
