"use client"

import Link from "next/link"
import * as React from "react"

import { navMain } from "@/components/admin/nav-config"
import { NavMain } from "@/components/nav-main"
import { NavProjects, type RecentCar } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { Car01Icon } from "@hugeicons/core-free-icons"

// shadcn "sidebar-08" block, populated with the signed-in dealer's data.
export function AppSidebar({
  dealerName,
  planLabel,
  publicUrl,
  user,
  recentCars,
  ...props
}: {
  dealerName: string
  planLabel: string
  publicUrl: string
  user: { name: string; email: string }
  recentCars: RecentCar[]
} & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <HugeiconsIcon icon={Car01Icon} strokeWidth={2} className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{dealerName}</span>
                <span className="truncate text-xs">{planLabel}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects cars={recentCars} />
        <NavSecondary publicUrl={publicUrl} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
