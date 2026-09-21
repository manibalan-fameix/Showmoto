// Background worker: run alongside the app with `pnpm worker`. Needs DATABASE_URL, the R2_* keys
// (or NODE_ENV=development for local storage), ffmpeg + ffprobe on PATH, and optionally VISION_API_KEY.
import { getVisionClient } from "../lib/ai/vision.ts"
import { VIDEO_QUEUE, getBoss, type VideoJob } from "../lib/jobs/boss.ts"
import { getStorage } from "../lib/storage/index.ts"
import { processVideoJob, realExec } from "./video.ts"

async function main() {
  // Fail fast with a clear message instead of failing on the first job.
  for (const bin of ["ffmpeg", "ffprobe"] as const) {
    await realExec(bin, ["-version"]).catch(() => {
      throw new Error(`${bin} was not found on PATH. Install ffmpeg (e.g. "brew install ffmpeg" or "apt install ffmpeg").`)
    })
  }
  const storage = getStorage()
  const vision = getVisionClient()
  const boss = await getBoss()

  await boss.work<VideoJob>(VIDEO_QUEUE, { batchSize: 1 }, async ([job]) => {
    await processVideoJob(job.data, { storage, vision })
  })
  console.log(`worker ready: queue "${VIDEO_QUEUE}", storage ${storage.kind}, vision ${vision ? "on" : "off"}`)

  const stop = async () => {
    await boss.stop({ graceful: true })
    process.exit(0)
  }
  process.on("SIGTERM", stop)
  process.on("SIGINT", stop)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
