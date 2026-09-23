"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, Car01Icon, Folder01Icon } from "@hugeicons/core-free-icons"

import { copy } from "@/lib/copy"

const t = copy.admin.addCar.start

function Option({ icon, title, body, onClick, href, testId }: { icon: typeof Car01Icon; title: string; body: string; onClick?: () => void; href?: string; testId?: string }) {
  const inner = (
    <>
      <span className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-muted">
        <HugeiconsIcon icon={icon} strokeWidth={1.5} className="size-10 text-muted-foreground" />
      </span>
      <span className="flex flex-1 flex-col gap-1 text-left">
        <span className="text-xl font-semibold">{title}</span>
        <span className="text-muted-foreground">{body}</span>
      </span>
      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-5 shrink-0 text-muted-foreground" />
    </>
  )
  const cls = "flex w-full items-center gap-6 rounded-3xl border border-border bg-card p-6 transition-colors hover:bg-muted/50"
  return href ? (
    <Link href={href} className={cls} data-testid={testId}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls} data-testid={testId}>
      {inner}
    </button>
  )
}

export function StartStep({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Option icon={Car01Icon} title={t.newTitle} body={t.newBody} onClick={onNew} testId="start-new" />
      <Option icon={Folder01Icon} title={t.continueTitle} body={t.continueBody} href="/cars" testId="start-continue" />
    </div>
  )
}
