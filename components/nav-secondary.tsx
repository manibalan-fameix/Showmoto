import Link from "next/link"
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import { navSecondary } from "@/components/admin/nav-config"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  publicUrl,
  ...props
}: { publicUrl: string } & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { viewPage, help } = navSecondary
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" render={<a href={publicUrl} target="_blank" rel="noreferrer" />}>
              <HugeiconsIcon icon={viewPage.icon} strokeWidth={2} />
              <span>{viewPage.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" render={<Link href={help.url} />}>
              <HugeiconsIcon icon={help.icon} strokeWidth={2} />
              <span>{help.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
