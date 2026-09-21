"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Camera01Icon, Image01Icon } from "@hugeicons/core-free-icons"

import { AngleOutline } from "@/components/capture/angle-outline"
import { Button } from "@/components/ui/button"
import type { CarAngle } from "@/lib/angles"
import { copy } from "@/lib/copy"
import { resizeToJpeg, type Resized } from "@/lib/image/resize"

const t = copy.admin.addCar.camera

/**
 * Full-screen guided capture: steps through `angles`, showing an outline and a one-line hint for
 * each. Uses the live camera when the browser allows it; otherwise falls back to the phone's own
 * camera app through a file input. Photos are resized and stripped of location data on device.
 */
export function CameraSession({
  angles,
  onShot,
  onClose,
}: {
  angles: CarAngle[]
  onShot: (angle: CarAngle, shot: Resized) => void
  onClose: () => void
}) {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<"starting" | "live" | "fallback">("starting")
  const [busy, setBusy] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const angle = angles[index]

  useEffect(() => {
    let cancelled = false
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) return setMode("fallback")
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1440 } },
          audio: false,
        })
        if (cancelled) return stream.getTracks().forEach((tr) => tr.stop())
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setMode("live")
      } catch {
        if (!cancelled) setMode("fallback")
      }
    }
    void start()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((tr) => tr.stop())
      streamRef.current = null
    }
  }, [])

  // Attach the stream once the <video> exists.
  useEffect(() => {
    if (mode === "live" && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current
  }, [mode])

  const advance = useCallback(() => {
    if (index + 1 >= angles.length) onClose()
    else setIndex((i) => i + 1)
  }, [index, angles.length, onClose])

  const handleBlob = useCallback(
    async (blob: Blob) => {
      setBusy(true)
      try {
        const shot = await resizeToJpeg(blob, 1920, 0.8)
        onShot(angle, shot)
        advance()
      } finally {
        setBusy(false)
      }
    },
    [angle, onShot, advance],
  )

  async function shutter() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d")?.drawImage(video, 0, 0)
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.92))
    if (blob) await handleBlob(blob)
  }

  const meta = copy.admin.angles[angle]

  return (
    <div role="dialog" aria-modal="true" aria-label={meta.label} className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <header className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs text-white/70">{t.counter(index + 1, angles.length)}</p>
          <h2 className="text-lg font-semibold" aria-live="polite">
            {meta.label}
          </h2>
          <p className="text-sm text-white/80">{meta.hint}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onClose} aria-label={t.close}>
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} data-icon="inline-start" />
          {t.close}
        </Button>
      </header>

      <div className="relative flex-1 overflow-hidden">
        {mode === "live" && <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 size-full object-cover" />}
        {mode !== "live" && (
          <p className="absolute inset-x-4 top-4 text-center text-sm text-white/70">{mode === "starting" ? t.starting : t.fallback}</p>
        )}
        <AngleOutline angle={angle} className="pointer-events-none absolute inset-0 m-auto w-[86%] max-w-xl text-white/70" />
      </div>

      <footer className="flex items-center justify-between gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button variant="ghost" onClick={advance} disabled={busy}>
          {t.skip}
        </Button>

        {mode === "live" ? (
          <Button size="icon-lg" className="size-16 rounded-full" onClick={shutter} disabled={busy} aria-label={t.shutter}>
            <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} className="size-7" />
          </Button>
        ) : (
          <label className="inline-flex">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              data-testid="camera-file-input"
              className="sr-only"
              disabled={busy || mode === "starting"}
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ""
                if (f) void handleBlob(f)
              }}
            />
            <span className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-4xl bg-primary px-5 text-sm font-medium text-primary-foreground">
              <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} className="size-4" />
              {t.takeOrChoose}
            </span>
          </label>
        )}

        {mode === "live" ? (
          <label className="inline-flex">
            <input
              type="file"
              accept="image/*"
              data-testid="camera-file-input"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ""
                if (f) void handleBlob(f)
              }}
            />
            <span className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-4xl bg-secondary px-4 text-sm font-medium text-secondary-foreground">
              <HugeiconsIcon icon={Image01Icon} strokeWidth={2} className="size-4" />
              {t.gallery}
            </span>
          </label>
        ) : (
          <span className="w-16" />
        )}
      </footer>
    </div>
  )
}
