import type * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { LinkSquare02Icon } from "@hugeicons/core-free-icons"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { copy } from "@/lib/copy"

export function NavSecondary({ publicUrl, ...props }: { publicUrl: string } & React.ComponentProps<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" render={<a href={publicUrl} target="_blank" rel="noreferrer" />}>
              <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={2} />
              <span>{copy.admin.nav.viewPage}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
