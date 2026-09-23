"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Camera01Icon } from "@hugeicons/core-free-icons"

import { ocrPlateAction, startCarAction } from "@/app/(admin)/(shell)/cars/actions"
import type { RcSummary } from "@/lib/cars/dto"
import { FooterAction } from "@/components/cars/wizard-shell"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { copy } from "@/lib/copy"
import { blobToBase64, resizeToJpeg } from "@/lib/image/resize"
import { formatReg, isValidReg } from "@/lib/reg"
import type { RcErrorCode } from "@/lib/rc/types"

const t = copy.admin.addCar.plate

export function PlateStep({ onStarted }: { onStarted: (r: { carId: string; rc: RcSummary | null; rcError: RcErrorCode | null }) => void }) {
  const [reg, setReg] = useState("")
  const [preview, setPreview] = useState<string | null>(null)
  const [hint, setHint] = useState<string>(t.typeNumber)
  const [reading, setReading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onPhoto(file: File) {
    setError(null)
    setReading(true)
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old)
      return URL.createObjectURL(file)
    })
    try {
      // Small and light: the plate only needs to be legible, and the server action body is capped.
      const { blob } = await resizeToJpeg(file, 1100, 0.75)
      const res = await ocrPlateAction({ base64: await blobToBase64(blob), mediaType: "image/jpeg" })
      if (!res.ok) return setHint(res.error === "rate_limited" ? t.rateLimited : t.notRead)
      if (!res.aiAvailable) return setHint(t.noAi)
      if (!res.reg) return setHint(t.notRead)
      setReg(formatReg(res.reg))
      setHint(res.valid ? t.checkNumber : t.notRead)
    } catch {
      setHint(t.notRead)
    } finally {
      setReading(false)
    }
  }

  async function start() {
    setError(null)
    if (!isValidReg(reg)) return setError(t.invalid)
    setStarting(true)
    try {
      const res = await startCarAction({ reg })
      if (!res.ok) return setError(res.error === "invalid_reg" ? t.invalid : t.failed)
      onStarted({ carId: res.carId, rc: res.rc, rcError: res.rcError })
    } catch {
      setError(t.failed)
    } finally {
      setStarting(false)
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-5 text-center">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            data-testid="plate-file-input"
            className="sr-only"
            disabled={reading || starting}
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ""
              if (f) void onPhoto(f)
            }}
          />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="max-h-40 rounded-lg object-contain" />
          ) : (
            <HugeiconsIcon icon={Camera01Icon} strokeWidth={1.5} className="size-10 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">{reading ? t.reading : preview ? t.retake : t.take}</span>
        </label>

        <div className="flex flex-col gap-2">
          <Label htmlFor="reg">{t.label}</Label>
          <Input
            id="reg"
            value={reg}
            onChange={(e) => setReg(e.target.value.toUpperCase())}
            placeholder={t.placeholder}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="h-11 text-lg tracking-wider"
          />
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {hint}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FooterAction>
          <Button size="lg" onClick={start} disabled={starting || reading || !reg.trim()}>
            {starting ? t.starting : t.start}
          </Button>
        </FooterAction>
      </CardContent>
    </Card>
  )
}
