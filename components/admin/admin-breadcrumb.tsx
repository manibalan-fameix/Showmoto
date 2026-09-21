"use client"

import { usePathname } from "next/navigation"

import { pageTitleFor } from "@/components/admin/nav-config"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { copy } from "@/lib/copy"

export function AdminBreadcrumb({ dealerName }: { dealerName: string }) {
  const title = pageTitleFor(usePathname())
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <span className="text-muted-foreground">{dealerName || copy.admin.nav.adminCrumb}</span>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>{title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
