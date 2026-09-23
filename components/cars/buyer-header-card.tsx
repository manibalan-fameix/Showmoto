"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Location01Icon } from "@hugeicons/core-free-icons"

import { calculateEmi, EmiCalculator } from "@/components/cars/emi-calculator"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const inr = new Intl.NumberFormat("en-IN")
const money = (value: number) => `₹${inr.format(Math.round(value))}`

export function BuyerHeaderCard({
  title,
  facts,
  location,
  dealerPhone,
  price,
  pricing,
}: {
  title: string
  facts: string[]
  location: string | null
  dealerPhone: string | null
  price: number | null
  pricing: {
    loanAmount: number | null
    downPayment: number | null
    loanDurationMonths: number | null
    interestRate: number | null
    bookingAmount: number | null
    tokenRefundable: boolean
  }
}) {
  const [showEmi, setShowEmi] = useState(false)

  const roundedPrice = price ? Math.max(0, Math.round(price)) : 0
  const defaultDownPayment = pricing.downPayment ?? (pricing.loanAmount ? roundedPrice - pricing.loanAmount : Math.round(roundedPrice * 0.2))
  const startingLoanAmount = Math.max(0, roundedPrice - defaultDownPayment)
  const startingDuration = pricing.loanDurationMonths ?? 60
  const startingRate = pricing.interestRate ?? 10.99
  const startingEmi = price ? calculateEmi(startingLoanAmount, startingRate, startingDuration) : null

  return (
    <div className="rounded-lg bg-muted p-5">
      <h1 className="text-2xl font-medium tracking-tight lg:text-3xl">{title}</h1>

      {facts.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {facts.map((fact) => (
            <span key={fact} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium">
              {fact}
            </span>
          ))}
        </div>
      ) : null}

      {location ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4 shrink-0" />
          {location}
        </div>
      ) : null}

      <div className="my-5 border-t border-border" />

      <p className="text-sm text-muted-foreground">Car price</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{price ? money(price) : "Price on request"}</p>
      <p className="mt-1 text-sm text-muted-foreground">Price excludes insurance transfer, RTO charges and taxes where applicable.</p>
      {pricing.bookingAmount ? (
        <p className="mt-2 text-sm">
          <span className="text-muted-foreground">Booking amount </span>
          <span className="font-semibold">
            {money(pricing.bookingAmount)}
            {pricing.tokenRefundable ? " (refundable)" : ""}
          </span>
        </p>
      ) : null}

      {price && startingEmi ? (
        <>
          <div className="my-5 border-t border-border" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Starting EMI</p>
              <p className="text-lg font-semibold">or {money(startingEmi)} / m</p>
            </div>
            <Button type="button" variant="outline" onClick={() => setShowEmi((v) => !v)}>
              {showEmi ? "Hide EMI calculator" : "Calculate your EMI"}
            </Button>
          </div>
          {showEmi ? (
            <div className="mt-4">
              <EmiCalculator
                price={price}
                initialLoanAmount={pricing.loanAmount}
                initialDownPayment={pricing.downPayment}
                initialDurationMonths={pricing.loanDurationMonths}
                interestRate={pricing.interestRate}
              />
            </div>
          ) : null}
        </>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-3">
        {dealerPhone ? (
          <>
            <a href={`tel:${dealerPhone}`} className={cn(buttonVariants({ size: "lg" }), "h-10 w-full")}>
              Continue
            </a>
            <a href={`tel:${dealerPhone}`} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 w-full")}>
              Request a callback
            </a>
          </>
        ) : (
          <Button size="lg" className="col-span-2 h-10 w-full" disabled>
            Continue
          </Button>
        )}
      </div>
    </div>
  )
}
