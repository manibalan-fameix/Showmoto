"use client"

import Link from "next/link"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { copy } from "@/lib/copy"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreHorizontalCircle01Icon, Car01Icon, Share03Icon, Archive02Icon } from "@hugeicons/core-free-icons"

export type RecentCar = { id: string; name: string; shareUrl: string }

// The block's "Projects" group, used for the dealer's most recent cars.
export function NavProjects({ cars }: { cars: RecentCar[] }) {
  const { isMobile } = useSidebar()
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{copy.admin.nav.recentCars}</SidebarGroupLabel>
      <SidebarMenu>
        {cars.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton render={<Link href={`/cars/${item.id}`} />}>
              <HugeiconsIcon icon={Car01Icon} strokeWidth={2} />
              <span>{item.name}</span>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuAction
                    showOnHover
                    className="aria-expanded:bg-muted"
                  />
                }
              >
                <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
                <span className="sr-only">{copy.admin.nav.more_sr}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem render={<Link href={`/cars/${item.id}`} />}>
                  <HugeiconsIcon icon={Car01Icon} strokeWidth={2} className="text-muted-foreground" />
                  <span>{copy.admin.nav.viewCar}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(copy.admin.nav.shareText(item.shareUrl))}`}
                      target="_blank"
                      rel="noreferrer"
                    />
                  }
                >
                  <HugeiconsIcon icon={Share03Icon} strokeWidth={2} className="text-muted-foreground" />
                  <span>{copy.admin.nav.shareCar}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <HugeiconsIcon icon={Archive02Icon} strokeWidth={2} className="text-muted-foreground" />
                  <span>{copy.admin.nav.archiveCar}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton render={<Link href="/cars" />}>
            <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
            <span>{copy.admin.nav.more}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
