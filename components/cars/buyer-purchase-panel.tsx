"use client"

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  AccidentIcon,
  Building06Icon,
  CalendarAdd02Icon,
  CalendarCheck01Icon,
  DashboardSpeed01Icon,
  EngineIcon,
  FuelStationIcon,
  GitBranchIcon,
  Key01Icon,
  Location01Icon,
  Note01Icon,
  PaintBoardIcon,
  RouteBlockIcon,
  ShieldCheckIcon,
  ShieldEnergyIcon,
  ShieldPlusIcon,
  TsunamiIcon,
  UserCheck01Icon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons"

import { featureIcon } from "@/lib/cars/feature-icons"
import { cn } from "@/lib/utils"

type Detail = { label: string; value: string }
type FeatureGroup = { group: string; items: string[] }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-muted p-5">
      <h2 className="mb-4 text-xl font-medium tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

const DETAIL_GRID_COLUMNS = 3

function DetailGrid({ items, iconByLabel }: { items: Detail[]; iconByLabel?: Record<string, IconSvgElement> }) {
  if (!items.length) return null
  const rowCount = Math.ceil(items.length / DETAIL_GRID_COLUMNS)
  const lastRowStart = (rowCount - 1) * DETAIL_GRID_COLUMNS

  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-5">
      {items.map((item, index) => {
        const icon = iconByLabel?.[item.label]
        return (
          <div
            key={`${item.label}-${item.value}`}
            className={cn("pb-4", index < lastRowStart && "border-b border-border")}
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              {icon ? <HugeiconsIcon icon={icon} strokeWidth={2} className="size-5 shrink-0" /> : null}
              <p className="text-xs">{item.label}</p>
            </div>
            <p className="mt-2 text-base font-medium">{item.value}</p>
          </div>
        )
      })}
    </div>
  )
}

const overviewIconByLabel: Record<string, IconSvgElement> = {
  "Make year": CalendarAdd02Icon,
  "Registration year": CalendarCheck01Icon,
  "Fuel type": FuelStationIcon,
  "KM driven": DashboardSpeed01Icon,
  Transmission: GitBranchIcon,
  Owner: UserCheck01Icon,
  "Insurance validity": ShieldEnergyIcon,
  "Insurance type": ShieldEnergyIcon,
  RTO: Building06Icon,
  Location: Location01Icon,
  Colour: PaintBoardIcon,
  "Body type": RouteBlockIcon,
  "Engine capacity": EngineIcon,
  "Spare key": Key01Icon,
  "Reg number": Building06Icon,
}

const inspectionIconByLabel: Record<string, IconSvgElement> = {
  "Inspection score": ShieldCheckIcon,
  "Inspection note": Note01Icon,
  Warranty: ShieldPlusIcon,
  "Service history": Wrench01Icon,
  "Accident history": AccidentIcon,
  "Flood affected": TsunamiIcon,
}

function DotList({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <ul className="grid gap-3 text-sm">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-3">
          <span className="size-3 rounded-full bg-primary" />
          <span className="font-medium">{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function BuyerPurchasePanel({
  overview,
  reasons,
  inspection,
  protectionPlans,
  condition,
  specs,
  featureGroups,
}: {
  overview: Detail[]
  reasons: string[]
  inspection: Detail[]
  protectionPlans: string[]
  condition: Detail[]
  specs: Detail[]
  featureGroups: FeatureGroup[]
}) {
  return (
    <aside className="w-full">
      <div className="grid gap-4">
        <Section title="Car overview">
          <DetailGrid items={overview} iconByLabel={overviewIconByLabel} />
        </Section>

        {reasons.length ? (
          <Section title="Reasons to buy">
            <DotList items={reasons} />
          </Section>
        ) : null}

        {inspection.length ? (
          <Section title="Inspection and trust">
            <DetailGrid items={inspection} iconByLabel={inspectionIconByLabel} />
          </Section>
        ) : null}

        {featureGroups.length ? (
          <Section title="Features">
            <div className="grid gap-4">
              {featureGroups.map((group) => (
                <div key={group.group}>
                  <h3 className="text-sm font-semibold capitalize">{group.group}</h3>
                  <ul className="mt-2 grid grid-cols-3 gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <HugeiconsIcon icon={featureIcon} strokeWidth={2} className="size-4 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {specs.length ? (
          <Section title="Specifications">
            <DetailGrid items={specs} />
          </Section>
        ) : null}

        {condition.length ? (
          <Section title="Condition">
            <DetailGrid items={condition} />
          </Section>
        ) : null}

        {protectionPlans.length ? (
          <Section title="Warranty">
            <DotList items={protectionPlans} />
          </Section>
        ) : null}
      </div>
    </aside>
  )
}
