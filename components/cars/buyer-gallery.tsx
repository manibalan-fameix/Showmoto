"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"

import type { CarAngle } from "@/lib/angles"
import { cn } from "@/lib/utils"

type GalleryPhoto = {
  url: string
  angle: CarAngle | null
}

const controlClass = "flex h-10 items-center justify-center rounded-md bg-muted/80 backdrop-blur-sm"

export function BuyerGallery({ photos, title }: { photos: GalleryPhoto[]; title: string }) {
  const [index, setIndex] = useState(0)
  const count = photos.length
  const active = photos[index] ?? null

  const move = (delta: number) => setIndex((i) => (i + delta + count) % count)

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-lg bg-muted">
        {active ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={active.url} alt={`${title} photo ${index + 1}`} className="aspect-[16/9] max-h-[30svh] w-full object-cover lg:max-h-none" />
        ) : (
          <div className="aspect-[16/9] max-h-[30svh] w-full lg:max-h-none" />
        )}
      </div>

      {count > 1 ? (
        <div className="absolute inset-x-0 -bottom-5 flex items-center justify-center gap-2">
          <button type="button" aria-label="Previous photo" onClick={() => move(-1)} className={cn(controlClass, "w-10")}>
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-5" />
          </button>
          <div className={cn(controlClass, "gap-2 px-4")}>
            {photos.map((photo, i) => (
              <button
                key={photo.url}
                type="button"
                aria-label={`Photo ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn("size-2.5 rounded-full", i === index ? "bg-foreground" : "bg-muted-foreground/40")}
              />
            ))}
          </div>
          <button type="button" aria-label="Next photo" onClick={() => move(1)} className={cn(controlClass, "w-10")}>
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-5" />
          </button>
        </div>
      ) : null}
    </div>
  )
}
