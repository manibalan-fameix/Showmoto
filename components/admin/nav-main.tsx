"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"

import { navMain } from "@/components/admin/nav-config"
import { Badge } from "@/components/ui/badge"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { copy } from "@/lib/copy"

export function NavMain() {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{copy.admin.nav.menu}</SidebarGroupLabel>
      <SidebarMenu>
        {navMain.map((item) => (
          <SidebarMenuItem key={item.url}>
            {item.enabled ? (
              <SidebarMenuButton
                tooltip={item.title}
                isActive={pathname === item.url || pathname.startsWith(`${item.url}/`)}
                render={<Link href={item.url} />}
              >
                <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                <span>{item.title}</span>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton tooltip={item.title} disabled aria-disabled>
                <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                <span>{item.title}</span>
                <Badge variant="secondary" className="ml-auto">
                  {copy.admin.nav.soon}
                </Badge>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
