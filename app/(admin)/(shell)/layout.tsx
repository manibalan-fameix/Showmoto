import { redirect } from "next/navigation"

import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb"
import { desc } from "drizzle-orm"

import { UploadProvider } from "@/components/capture/upload-provider"
import { AppSidebar } from "@/components/app-sidebar"
import type { RecentCar } from "@/components/nav-projects"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { copy } from "@/lib/copy"
import { getDealerContext } from "@/lib/auth/context"
import { cars } from "@/lib/db/schema"
import { scopedDb } from "@/lib/db/scoped"
import { tenantUrl } from "@/lib/env"

const DEMO_CARS = [
  { id: "demo-1", year: 2017, regPrefix: "tn11", shortCode: "k7x2m" },
  { id: "demo-2", year: 2019, regPrefix: "tn09", shortCode: "p4d8q" },
  { id: "demo-3", year: 2015, regPrefix: "tn22", shortCode: "w3n6r" },
]

// Signed-in area. Authorization happens here on the server, not in the proxy.
export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getDealerContext()
  if (ctx.status === "anonymous") redirect("/login")

  const dealerName = ctx.status === "ok" ? ctx.dealer.displayName : copy.brand.name
  const planLabel = ctx.status === "ok" ? ctx.plan.label : ""
  const publicUrl = ctx.status === "ok" ? tenantUrl(ctx.dealer.slug) : "/"
  const user = { name: ctx.user.name ?? "", email: ctx.user.email ?? "" }

  let recentCars: RecentCar[] = []
  if (ctx.status === "ok") {
    const rows = !ctx.dealerInDb
      ? DEMO_CARS
      : await scopedDb(ctx.dealer.id).cars.select(undefined, { orderBy: [desc(cars.listedAt)], limit: 4 })
    // Only id, year, plate prefix and short code go to the client. Never the encrypted reg number.
    recentCars = rows.map((c) => ({
      id: c.id,
      name: `${c.year} ${(c.regPrefix ?? "").toUpperCase()}`.trim(),
      shareUrl: `${publicUrl}${c.shortCode}`,
    }))
  }

  return (
    <SidebarProvider>
      <AppSidebar dealerName={dealerName} planLabel={planLabel} publicUrl={publicUrl} user={user} recentCars={recentCars} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
            <AdminBreadcrumb dealerName={dealerName} />
          </div>
          <div className="ml-auto px-4">
            <ThemeToggle />
          </div>
        </header>
        {/* Uploads run for the whole admin session, so they carry on while the dealer navigates. */}
        <UploadProvider>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
        </UploadProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
