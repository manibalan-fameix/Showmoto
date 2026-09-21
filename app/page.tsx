import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { copy } from "@/lib/copy"
import { adminUrl } from "@/lib/env"
import { cn } from "@/lib/utils"

// Marketing placeholder for the root domain.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-6 p-6">
      <p className="text-sm font-medium text-primary">{copy.brand.name}</p>
      <h1 className="text-3xl font-semibold tracking-tight">{copy.marketing.heading}</h1>
      <p className="text-muted-foreground">{copy.marketing.body}</p>
      <Link href={adminUrl("/login")} className={cn(buttonVariants({ size: "lg" }), "w-fit")}>
        {copy.marketing.cta}
      </Link>
    </main>
  )
}
