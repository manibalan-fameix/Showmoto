import { PgBoss } from "pg-boss"

export const VIDEO_QUEUE = "video-process"
export type VideoJob = { dealerId: string; carId: string; mediaId: string }

let boss: Promise<PgBoss> | null = null

/** One shared, lazily started pg-boss client. pg-boss creates and migrates its own schema. */
export function getBoss(): Promise<PgBoss> {
  boss ??= (async () => {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set")
    const b = new PgBoss(process.env.DATABASE_URL)
    b.on("error", (e) => console.error("pg-boss error:", e.message))
    await b.start()
    await b.createQueue(VIDEO_QUEUE)
    return b
  })().catch((e) => {
    boss = null
    throw e
  })
  return boss
}

/**
 * Queue the video for HLS conversion and the missing-angle check. A failure here never fails the
 * upload: the original video is safe in storage and can be re-queued.
 */
export async function enqueueVideoJob(job: VideoJob): Promise<void> {
  try {
    const b = await getBoss()
    // singletonKey: confirming the same upload twice queues one job.
    await b.send(VIDEO_QUEUE, job, { singletonKey: job.mediaId, retryLimit: 3, retryBackoff: true })
  } catch (e) {
    console.error("could not queue video job:", e instanceof Error ? e.message : "unknown")
  }
}
