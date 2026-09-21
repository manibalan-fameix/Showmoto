"use client"

import Link from "next/link"
import { useCallback, useState } from "react"

import { getCarStateAction } from "@/app/(admin)/(shell)/cars/actions"
import { DetailsStep } from "@/components/cars/details-step"
import { PhotosStep } from "@/components/cars/photos-step"
import { PlateStep } from "@/components/cars/plate-step"
import { PriceStep } from "@/components/cars/price-step"
import { ShareKitPanel } from "@/components/cars/share-kit-panel"
import { Stepper, type Step } from "@/components/cars/stepper"
import { Button, buttonVariants } from "@/components/ui/button"
import type { RcSummary } from "@/lib/cars/dto"
import type { ShareKit } from "@/lib/cars/publish"
import type { CarState } from "@/lib/cars/state"
import { copy } from "@/lib/copy"
import type { RcErrorCode } from "@/lib/rc/types"
import { cn } from "@/lib/utils"

const t = copy.admin.addCar

function deriveStep(car: CarState | null, requested?: Step): Step {
  if (!car) return "plate"
  if (car.status === "live") return "done"
  if (requested && requested !== "plate") return car.variant || requested === "car" ? requested : "car"
  return car.variant ? "photos" : "car"
}

/** The whole add-a-car flow. Resumable: pass an existing draft and it lands on the right step. */
export function AddCarWizard({
  initialCar,
  initialKit,
  initialStep,
}: {
  initialCar: CarState | null
  initialKit: ShareKit | null
  initialStep?: Step
}) {
  const [car, setCar] = useState<CarState | null>(initialCar)
  const [step, setStep] = useState<Step>(() => deriveStep(initialCar, initialStep))
  const [rc, setRc] = useState<RcSummary | null>(null)
  const [rcError, setRcError] = useState<RcErrorCode | null>(null)
  const [kit, setKit] = useState<ShareKit | null>(initialKit)

  const go = useCallback((s: Step) => {
    setStep(s)
    window.scrollTo({ top: 0 })
  }, [])

  async function onStarted(r: { carId: string; rc: RcSummary | null; rcError: RcErrorCode | null }) {
    const res = await getCarStateAction(r.carId)
    if (!res.ok) return
    setCar(res.car)
    setRc(r.rc)
    setRcError(r.rcError)
    // Keep the URL resumable without a server round trip.
    window.history.replaceState(null, "", `/cars/new?car=${r.carId}`)
    go("car")
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <h1 className="text-xl font-semibold">{t.title}</h1>
      {step !== "done" && <Stepper step={step} />}

      {step === "plate" && <PlateStep onStarted={onStarted} />}

      {step === "car" && car && <DetailsStep car={car} rc={rc} rcError={rcError} onCarChange={setCar} onNext={() => go("photos")} />}

      {step === "photos" && car && (
        <>
          <PhotosStep car={car} onCarChange={setCar} onNext={() => go("price")} />
          <Button variant="ghost" onClick={() => go("car")}>
            {t.back}
          </Button>
        </>
      )}

      {step === "price" && car && (
        <>
          <PriceStep
            car={car}
            onCarChange={setCar}
            onPublished={(k, c) => {
              setKit(k)
              setCar(c)
              go("done")
            }}
          />
          <Button variant="ghost" onClick={() => go("photos")}>
            {t.back}
          </Button>
        </>
      )}

      {step === "done" && car && (
        <>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold" data-testid="published-title">
              {copy.admin.addCar.done.title}
            </h2>
            <p className="text-sm text-muted-foreground">{car.variant?.label}</p>
          </div>
          {kit && <ShareKitPanel kit={kit} title={car.variant?.label} />}
          <div className="flex flex-wrap gap-2">
            {kit && (
              <a href={kit.canonicalUrl} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline" }))}>
                {t.done.open}
              </a>
            )}
            {/* Hard navigation on purpose: it guarantees a fresh wizard (the URL was rewritten in place). */}
            <Button variant="outline" onClick={() => window.location.assign(new URL("/cars/new", window.location.origin).href)}>
              {t.done.another}
            </Button>
            <Link href="/cars" className={cn(buttonVariants({ variant: "ghost" }))}>
              {t.done.allCars}
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
