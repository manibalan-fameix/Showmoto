import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/admin/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { copy } from "@/lib/copy"
import { getDealerContext } from "@/lib/auth/context"

// Signed-in area. Authorization happens here on the server, not in the proxy.
export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getDealerContext()
  if (ctx.status === "anonymous") redirect("/login")

  const userLabel = ctx.user.email ?? ctx.user.name ?? ""

  return (
    <SidebarProvider>
      <AppSidebar dealerName={ctx.status === "ok" ? ctx.dealer.displayName : copy.brand.name} userLabel={userLabel} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
