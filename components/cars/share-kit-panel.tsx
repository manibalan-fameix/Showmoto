"use client"

import { useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Copy01Icon, Download01Icon, Share08Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ShareKit } from "@/lib/cars/publish"
import { copy } from "@/lib/copy"
import { cropPortrait45 } from "@/lib/image/resize"

const t = copy.admin.addCar.done

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(t.copied)
  } catch {
    toast.error(text) // clipboard blocked: show the text so it can be copied by hand
  }
}

/** 4:5 crops of the listing photos, done on the device so nothing extra is stored or paid for. */
async function buildCarousel(photos: ShareKit["photos"]): Promise<File[]> {
  const files: File[] = []
  for (const [i, p] of photos.entries()) {
    const res = await fetch(p.url)
    const blob = await cropPortrait45(await res.blob())
    files.push(new File([blob], `car-${String(i + 1).padStart(2, "0")}.jpg`, { type: "image/jpeg" }))
  }
  return files
}

export function ShareKitPanel({ kit, title }: { kit: ShareKit; title?: string }) {
  const [busy, setBusy] = useState<"share" | "download" | null>(null)

  async function share() {
    setBusy("share")
    try {
      const files = await buildCarousel(kit.photos)
      const data: ShareData = { title: title ?? t.shareText, text: kit.caption, files }
      if (navigator.canShare?.(data)) await navigator.share(data)
      else if (navigator.share) await navigator.share({ title: title ?? t.shareText, text: kit.caption, url: kit.shortLink })
      else await copyText(kit.caption)
    } catch (e) {
      // The user closing the share sheet is not an error.
      if ((e as Error).name !== "AbortError") toast.error(copy.admin.addCar.plate.failed)
    } finally {
      setBusy(null)
    }
  }

  async function download() {
    setBusy("download")
    try {
      for (const file of await buildCarousel(kit.photos)) {
        const url = URL.createObjectURL(file)
        const a = Object.assign(document.createElement("a"), { href: url, download: file.name })
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.body}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{t.link}</p>
          <div className="flex gap-2">
            <Input readOnly value={kit.shortLink} aria-label={t.link} data-testid="short-link" className="h-10" onFocus={(e) => e.currentTarget.select()} />
            <Button variant="outline" onClick={() => copyText(kit.shortLink)}>
              <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} data-icon="inline-start" />
              {t.copy}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{t.caption}</p>
          <Textarea readOnly value={kit.caption} rows={9} data-testid="caption" aria-label={t.caption} />
          <Button variant="outline" className="w-fit" onClick={() => copyText(kit.caption)}>
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} data-icon="inline-start" />
            {t.copy}
          </Button>
        </div>

        {kit.photos.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{t.carousel}</p>
            <ul className="flex gap-2 overflow-x-auto pb-1">
              {kit.photos.map((p) => (
                <li key={p.angle} className="w-24 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="aspect-[4/5] w-full rounded-lg object-cover" />
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button onClick={share} disabled={busy !== null}>
                <HugeiconsIcon icon={Share08Icon} strokeWidth={2} data-icon="inline-start" />
                {busy === "share" ? t.preparing : t.share}
              </Button>
              <Button variant="outline" onClick={download} disabled={busy !== null}>
                <HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" />
                {busy === "download" ? t.preparing : t.download}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
