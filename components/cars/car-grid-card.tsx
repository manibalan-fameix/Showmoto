"use client"

import { useState } from "react"
import Link from "next/link"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  Car01Icon,
  DashboardSpeed01Icon,
  Fuel02Icon,
  HeartIcon,
  Medal01Icon,
  SteeringIcon,
} from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { copy } from "@/lib/copy"
import type { ListingItem } from "@/lib/cars/filters"
import { formatInr } from "@/lib/share/caption"
import { cn } from "@/lib/utils"

const t = copy.tenant

type Specification = { icon: IconSvgElement; label: string }

export function CarGridCard({ item }: { item: ListingItem }) {
  const [index, setIndex] = useState(0)
  const [saved, setSaved] = useState(false)
  const hasMultiple = item.images.length > 1

  const specifications = [
    item.kmDriven != null
      ? {
          icon: DashboardSpeed01Icon,
          label: `${formatInr(item.kmDriven)} ${t.km}`,
        }
      : null,
    item.fuel ? { icon: Fuel02Icon, label: item.fuel } : null,
    item.transmission ? { icon: SteeringIcon, label: item.transmission } : null,
  ].filter((spec): spec is Specification => Boolean(spec))

  const reasons =
    item.reasonsToBuy.length > 0
      ? t.car.reasonsToBuy(item.reasonsToBuy[0], item.reasonsToBuy.length - 1)
      : null

  const step = (delta: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIndex((i) => (i + delta + item.images.length) % item.images.length)
  }

  return (
    <Card className="group h-full gap-0 rounded-[16px] border border-border py-0 shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        <Link
          href={`/${item.slug}`}
          className="block size-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
        >
          {item.images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.images[index]}
              alt=""
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <HugeiconsIcon
                icon={Car01Icon}
                strokeWidth={1.5}
                className="size-10"
              />
            </div>
          )}
        </Link>

        <div className="absolute top-3 left-3 flex items-center gap-2">
          {item.regPrefix && (
            <Badge className="bg-background/90 text-foreground shadow-sm backdrop-blur-sm">
              {item.regPrefix}
            </Badge>
          )}
          {item.reasonsToBuy.length > 0 && (
            <Badge className="bg-primary text-primary-foreground">
              Dealer verified
            </Badge>
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          aria-label={saved ? "Remove from saved cars" : "Save this car"}
          aria-pressed={saved}
          onClick={() => setSaved((value) => !value)}
          className="absolute top-3 right-3 rounded-full bg-background/90 shadow-sm backdrop-blur-sm hover:bg-background"
        >
          <HugeiconsIcon
            icon={HeartIcon}
            strokeWidth={2}
            className={saved ? "fill-primary text-primary" : ""}
          />
        </Button>

        {hasMultiple && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              aria-label={t.car.prevPhoto}
              onClick={step(-1)}
              className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-background/90 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              aria-label={t.car.nextPhoto}
              onClick={step(1)}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-background/90 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Button>
            <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
              {item.images.map((url, imageIndex) => (
                <span
                  key={url}
                  className={cn(
                    "size-1.5 rounded-full bg-background/60 transition-all",
                    imageIndex === index && "w-4 bg-background"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Link
        href={`/${item.slug}`}
        className="flex flex-1 flex-col gap-4 p-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
      >
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {item.variantLabel ?? item.model ?? "Pre-owned vehicle"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-semibold tracking-tight">
                {item.askingPrice != null
                  ? `₹${formatInr(item.askingPrice)}`
                  : t.priceOnRequest}
              </p>
              {item.emiPerMonth != null && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.car.emiFrom(formatInr(item.emiPerMonth))}
                </p>
              )}
            </div>
          </div>
        </div>

        {specifications.length > 0 && (
          <ul className="flex flex-wrap gap-2 border-y border-border/60 py-3">
            {specifications.map(({ icon, label }) => (
              <li
                key={label}
                className="flex min-w-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1.5 text-xs text-muted-foreground"
              >
                <HugeiconsIcon
                  icon={icon}
                  strokeWidth={1.8}
                  className="size-3.5 shrink-0 text-foreground"
                />
                <span className="truncate">{label}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-center justify-between gap-3">
          {reasons ? (
            <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <HugeiconsIcon
                icon={Medal01Icon}
                strokeWidth={2}
                className="size-4 shrink-0 text-primary"
              />
              <span className="truncate">{reasons}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <HugeiconsIcon
                icon={Calendar03Icon}
                strokeWidth={2}
                className="size-4 text-primary"
              />
              Ready to test drive
            </span>
          )}
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="size-4 shrink-0 text-muted-foreground transition-transform group-focus-within:translate-x-1 group-hover:translate-x-1"
          />
        </div>
      </Link>
    </Card>
  )
}
