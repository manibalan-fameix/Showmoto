import type { IconSvgElement } from "@hugeicons/react"
import {
  Car01Icon,
  ChartLineData01Icon,
  Home01Icon,
  HelpCircleIcon,
  LinkSquare02Icon,
  RouteIcon,
  Settings02Icon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons"

import { copy } from "@/lib/copy"

const n = copy.admin.nav

export type NavMainItem = {
  title: string
  url: string
  icon: IconSvgElement
  items?: { title: string; url: string }[]
}

export const navMain: NavMainItem[] = [
  { title: n.dashboard, url: "/dashboard", icon: Home01Icon },
  {
    title: n.cars,
    url: "/cars",
    icon: Car01Icon,
    items: [
      { title: n.addCar, url: "/cars/new" },
      { title: n.soldCars, url: "/cars/sold" },
    ],
  },
  { title: n.leads, url: "/leads", icon: UserMultiple02Icon, items: [{ title: n.pipeline, url: "/leads/pipeline" }] },
  { title: n.transfers, url: "/transfers", icon: RouteIcon },
  { title: n.reports, url: "/reports", icon: ChartLineData01Icon },
  {
    title: n.settings,
    url: "/settings",
    icon: Settings02Icon,
    items: [
      { title: n.hours, url: "/settings/hours" },
      { title: n.theme, url: "/settings/theme" },
      { title: n.team, url: "/settings/team" },
    ],
  },
]

export const navSecondary = { help: { title: n.help, url: "/help", icon: HelpCircleIcon }, viewPage: { title: n.viewPage, icon: LinkSquare02Icon } }

/** Destinations reachable from the sidebar and user menu that have no screen yet. */
export const userMenuPages = [
  { title: n.upgrade, url: "/settings/plan" },
  { title: n.account, url: "/settings/account" },
  { title: n.billing, url: "/settings/billing" },
  { title: n.notifications, url: "/settings/notifications" },
]

const allPages: { title: string; url: string }[] = [
  ...navMain.flatMap((i) => [{ title: i.title, url: i.url }, ...(i.items ?? [])]),
  { title: n.help, url: "/help" },
  ...userMenuPages,
  { title: n.recentCars, url: "/cars" },
]

export function pageFor(pathname: string) {
  return allPages.find((p) => p.url === pathname)
}

/** Longest matching page, so /cars/new titles as "Add a car" and unknown children fall back to their parent. */
export function pageTitleFor(pathname: string): string {
  const exact = pageFor(pathname)
  if (exact) return exact.title
  const parent = [...allPages].sort((a, b) => b.url.length - a.url.length).find((p) => pathname.startsWith(`${p.url}/`))
  return parent?.title ?? n.dashboard
}

/** Sidebar and user-menu destinations without a screen yet, plus per-car pages. */
export function isPlaceholderPath(pathname: string): boolean {
  return Boolean(pageFor(pathname)) || /^\/cars\/[\w-]+$/.test(pathname)
}
