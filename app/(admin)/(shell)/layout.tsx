import { redirect } from "next/navigation"

import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb"
import { AppSidebar } from "@/components/admin/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { copy } from "@/lib/copy"
import { getDealerContext } from "@/lib/auth/context"
import { tenantUrl } from "@/lib/env"

// Signed-in area. Authorization happens here on the server, not in the proxy.
export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getDealerContext()
  if (ctx.status === "anonymous") redirect("/login")

  const dealerName = ctx.status === "ok" ? ctx.dealer.displayName : copy.brand.name
  const planLabel = ctx.status === "ok" ? ctx.plan.label : ""
  const publicUrl = ctx.status === "ok" ? tenantUrl(ctx.dealer.slug) : "/"
  const user = { name: ctx.user.name ?? "", email: ctx.user.email ?? "" }

  return (
    <SidebarProvider>
      <AppSidebar dealerName={dealerName} planLabel={planLabel} publicUrl={publicUrl} user={user} />
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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
