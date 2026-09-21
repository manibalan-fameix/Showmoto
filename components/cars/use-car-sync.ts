"use client"

import { useCallback, useEffect, useRef } from "react"

import { getCarStateAction } from "@/app/(admin)/(shell)/cars/actions"
import { useUploads } from "@/components/capture/upload-provider"
import type { CarState } from "@/lib/cars/state"

/**
 * Keeps the wizard's copy of the car in step with the server while uploads finish and video
 * processes. Refreshes shortly after each upload completes, when a step mounts, and while a
 * video is being processed. Responses that arrive out of order are dropped.
 */
export function useCarSync(car: CarState, onCarChange: (c: CarState) => void) {
  const uploads = useUploads()
  const seq = useRef(0)
  const latest = useRef(onCarChange)
  useEffect(() => {
    latest.current = onCarChange
  })

  const refresh = useCallback(async () => {
    const mine = ++seq.current
    const res = await getCarStateAction(car.id)
    if (res.ok && mine === seq.current) latest.current(res.car)
  }, [car.id])

  const doneCount = uploads.items(car.id).filter((i) => i.state === "done").length
  const video = car.media.find((m) => m.kind === "video")
  const videoBusy = video?.status === "processing" || video?.status === "pending"

  // On mount, and after each upload lands.
  useEffect(() => {
    const id = setTimeout(() => void refresh(), doneCount === 0 ? 0 : 300)
    return () => clearTimeout(id)
  }, [doneCount, refresh])

  useEffect(() => {
    if (!videoBusy) return
    const id = setInterval(() => void refresh(), 5000)
    return () => clearInterval(id)
  }, [videoBusy, refresh])

  return refresh
}
