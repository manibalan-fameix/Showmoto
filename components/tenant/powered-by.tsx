import { copy } from "@/lib/copy"

export function PoweredBy() {
  return (
    <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
      {copy.tenant.poweredBy} {copy.brand.name}
    </footer>
  )
}
