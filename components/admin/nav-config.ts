import type { IconSvgElement } from "@hugeicons/react"
import {
  Car01Icon,
  ChartLineData01Icon,
  Home01Icon,
  RouteIcon,
  Settings02Icon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons"

import { copy } from "@/lib/copy"

export type NavItem = { title: string; url: string; icon: IconSvgElement; enabled: boolean }

// Flip `enabled` as each screen ships. Disabled items render muted with a "Soon" badge.
export const navMain: NavItem[] = [
  { title: copy.admin.nav.dashboard, url: "/dashboard", icon: Home01Icon, enabled: true },
  { title: copy.admin.nav.cars, url: "/cars", icon: Car01Icon, enabled: false },
  { title: copy.admin.nav.leads, url: "/leads", icon: UserMultiple02Icon, enabled: false },
  { title: copy.admin.nav.transfers, url: "/transfers", icon: RouteIcon, enabled: false },
  { title: copy.admin.nav.reports, url: "/reports", icon: ChartLineData01Icon, enabled: false },
  { title: copy.admin.nav.settings, url: "/settings", icon: Settings02Icon, enabled: false },
]

export function pageTitleFor(pathname: string): string {
  return navMain.find((i) => pathname === i.url || pathname.startsWith(`${i.url}/`))?.title ?? copy.admin.nav.dashboard
}
