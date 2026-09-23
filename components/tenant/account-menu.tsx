"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Car01Icon,
  File02Icon,
  Notification01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const items = [
  { label: "My Appointments", icon: Calendar03Icon, tag: "Sell" },
  { label: "My Bookings", icon: Car01Icon, tag: "Buy" },
  { label: "My Orders", icon: File02Icon },
  { label: "Communication Preferences", icon: Notification01Icon },
]

export function AccountMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        openOnHover
        delay={100}
        render={
          <Button variant="ghost" className="rounded-full px-3 py-2 text-sm font-medium" />
        }
      >
        <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} className="size-5 shrink-0" />
        <span className="hidden md:inline">My account</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-3">
        <Button
          className="mb-2 h-11 w-full rounded-2xl uppercase"
          render={<Link href="/account" />}
        >
          Log in / Sign up
        </Button>
        <DropdownMenuGroup className="rounded-2xl bg-muted/50 px-1">
          {items.map((item, i) => (
            <div key={item.label}>
              {i > 0 && <DropdownMenuSeparator className="mx-2" />}
              <DropdownMenuItem
                className="justify-between py-3 font-medium"
                render={<Link href="/account" />}
              >
                <span className="flex items-center gap-3">
                  <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-5" />
                  {item.label}
                </span>
                {item.tag && <Badge>{item.tag}</Badge>}
              </DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
