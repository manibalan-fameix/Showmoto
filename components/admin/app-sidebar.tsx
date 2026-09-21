"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  ChartLineData01Icon,
  Car01Icon,
  Home01Icon,
  Logout02Icon,
  RouteIcon,
  Settings02Icon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { copy } from "@/lib/copy"
import { signOutAction } from "@/lib/auth/actions"

type NavItem = { label: string; href: string; icon: IconSvgElement; enabled: boolean }

const nav: NavItem[] = [
  { label: copy.admin.nav.dashboard, href: "/dashboard", icon: Home01Icon, enabled: true },
  { label: copy.admin.nav.cars, href: "/cars", icon: Car01Icon, enabled: false },
  { label: copy.admin.nav.leads, href: "/leads", icon: UserMultiple02Icon, enabled: false },
  { label: copy.admin.nav.transfers, href: "/transfers", icon: RouteIcon, enabled: false },
  { label: copy.admin.nav.reports, href: "/reports", icon: ChartLineData01Icon, enabled: false },
  { label: copy.admin.nav.settings, href: "/settings", icon: Settings02Icon, enabled: false },
]

export function AppSidebar({
  dealerName,
  userLabel,
}: {
  dealerName: string
  userLabel: string
}) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <p className="truncate px-2 py-1 font-semibold">{dealerName}</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  {item.enabled ? (
                    <SidebarMenuButton render={<Link href={item.href} />} isActive={pathname.startsWith(item.href)}>
                      <HugeiconsIcon icon={item.icon} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton disabled aria-disabled>
                      <HugeiconsIcon icon={item.icon} />
                      <span>{item.label}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {copy.admin.nav.soon}
                      </Badge>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <p className="truncate px-2 text-xs text-muted-foreground">{userLabel}</p>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" className="w-full justify-start">
            <HugeiconsIcon icon={Logout02Icon} data-icon="inline-start" />
            {copy.auth.signOut}
          </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
  )
}
