"use client"

import { useMemo, useState } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { calculateEmi } from "@/lib/cars/emi"

export { calculateEmi }

const inr = new Intl.NumberFormat("en-IN")
const money = (value: number) => `₹${inr.format(Math.round(value))}`

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function SliderRow({
  label,
  value,
  helper,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  helper: string
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold">{helper}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => onChange(Array.isArray(next) ? (next[0] ?? value) : next)}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label === "Duration" ? `${min} mo` : money(min)}</span>
        <span>{label === "Duration" ? `${max} mo` : money(max)}</span>
      </div>
    </div>
  )
}

export function EmiCalculator({
  price,
  initialLoanAmount,
  initialDownPayment,
  initialDurationMonths,
  interestRate,
}: {
  price: number
  initialLoanAmount?: number | null
  initialDownPayment?: number | null
  initialDurationMonths?: number | null
  interestRate?: number | null
}) {
  const roundedPrice = Math.max(0, Math.round(price))
  const minDownPayment = Math.round(roundedPrice * 0.1)
  const maxDownPayment = Math.round(roundedPrice * 0.8)
  const defaultDownPayment = initialDownPayment ?? (initialLoanAmount ? roundedPrice - initialLoanAmount : Math.round(roundedPrice * 0.2))
  const [downPayment, setDownPayment] = useState(() => clamp(defaultDownPayment, minDownPayment, maxDownPayment))
  const [duration, setDuration] = useState(() => clamp(initialDurationMonths ?? 60, 12, 84))
  const rate = interestRate ?? 10.99

  const loanAmount = roundedPrice - downPayment
  const emi = useMemo(() => calculateEmi(loanAmount, rate, duration), [duration, loanAmount, rate])
  const totalPayable = emi * duration
  const interestPayable = Math.max(0, totalPayable - loanAmount)
  const principalPct = totalPayable > 0 ? (loanAmount / totalPayable) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardDescription>EMI calculator</CardDescription>
        <CardTitle className="text-2xl">{money(emi)} / month</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-2">
          <div className="h-3 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary" style={{ width: `${principalPct}%` }} />
          </div>
          <div className="grid gap-1 text-xs text-muted-foreground">
            <div className="flex justify-between gap-3">
              <span>Principal loan amount</span>
              <span>{money(loanAmount)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Total interest payable</span>
              <span>{money(interestPayable)}</span>
            </div>
            <div className="flex justify-between gap-3 font-medium text-foreground">
              <span>Total amount payable</span>
              <span>{money(totalPayable)}</span>
            </div>
          </div>
        </div>

        <SliderRow
          label="Loan amount"
          value={loanAmount}
          helper={money(loanAmount)}
          min={roundedPrice - maxDownPayment}
          max={roundedPrice - minDownPayment}
          step={5000}
          onChange={(nextLoan) => setDownPayment(roundedPrice - nextLoan)}
        />
        <SliderRow
          label="Down payment"
          value={downPayment}
          helper={money(downPayment)}
          min={minDownPayment}
          max={maxDownPayment}
          step={5000}
          onChange={setDownPayment}
        />
        <SliderRow
          label="Duration"
          value={duration}
          helper={`${duration} months`}
          min={12}
          max={84}
          step={6}
          onChange={setDuration}
        />

        <p className="text-xs text-muted-foreground">
          EMI is indicative, calculated at {rate}% p.a. Final approval, rate and charges depend on the finance partner.
        </p>
      </CardContent>
    </Card>
  )
}
