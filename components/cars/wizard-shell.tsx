"use client"

import Link from "next/link"
import { createContext, useContext, useState } from "react"
import { createPortal } from "react-dom"

import { Button, buttonVariants } from "@/components/ui/button"
import { copy } from "@/lib/copy"
import { cn } from "@/lib/utils"

const FooterSlot = createContext<HTMLElement | null>(null)

/** Renders its children in the shell's bottom-right slot, so each step keeps its own submit logic. */
export function FooterAction({ children }: { children: React.ReactNode }) {
  const slot = useContext(FooterSlot)
  return slot ? createPortal(children, slot) : null
}

/**
 * Full-screen focused layout: brand and Exit on top, a big heading, one centred column,
 * then segmented progress with Back on the left and the step's primary action on the right.
 */
export function WizardShell({
  title,
  subtitle,
  segments,
  active,
  onBack,
  children,
}: {
  title: string
  subtitle?: string
  segments?: number
  active?: number
  onBack?: () => void
  children: React.ReactNode
}) {
  const [slot, setSlot] = useState<HTMLElement | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between px-6 py-5 sm:px-14">
        <span className="text-lg font-semibold tracking-tight">{copy.brand.name}</span>
        <Link href="/cars" className={cn(buttonVariants({ variant: "outline" }))}>
          {copy.admin.addCar.exit}
        </Link>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-6">
        <div className="mx-auto flex w-full max-w-[830px] flex-col gap-8 pb-8 pt-4">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl" data-testid="wizard-title">
              {title}
            </h1>
            {subtitle && <p className="text-lg text-muted-foreground sm:text-xl">{subtitle}</p>}
          </div>
          <FooterSlot.Provider value={slot}>{children}</FooterSlot.Provider>
        </div>
      </main>

      <footer className="flex shrink-0 flex-col gap-4 px-6 pb-6 sm:px-14">
        {segments ? (
          <div className="flex gap-2" role="progressbar" aria-valuemin={0} aria-valuemax={segments} aria-valuenow={active ?? 0} aria-label="Progress">
            {Array.from({ length: segments }, (_, i) => (
              <span key={i} className={cn("h-1 flex-1 rounded-full", i < (active ?? 0) ? "bg-primary" : "bg-muted")} />
            ))}
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          {onBack ? (
            <Button variant="ghost" size="lg" onClick={onBack}>
              {copy.admin.addCar.back}
            </Button>
          ) : (
            <span />
          )}
          <div ref={setSlot} className="flex items-center gap-2" />
        </div>
      </footer>
    </div>
  )
}
