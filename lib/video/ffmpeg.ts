// Pure builders for ffmpeg/ffprobe argument lists. Nothing here runs a process, so it is unit-tested.
// Commands are always run with an argument array (never a shell), so file names cannot inject anything.

export type Probe = { durationSec: number; width: number; height: number; hasAudio: boolean }

export const RENDITIONS = [
  { height: 360, bandwidth: 900_000 },
  { height: 720, bandwidth: 2_500_000 },
] as const

export const probeArgs = (input: string) => [
  "-v", "error", "-print_format", "json", "-show_format", "-show_streams", input,
]

/** Parse `ffprobe -print_format json` output. Throws on anything that is not a playable video. */
export function parseProbe(json: string): Probe {
  const data = JSON.parse(json) as {
    format?: { duration?: string }
    streams?: { codec_type?: string; width?: number; height?: number; duration?: string; side_data_list?: { rotation?: number }[]; tags?: { rotate?: string } }[]
  }
  const video = data.streams?.find((s) => s.codec_type === "video")
  if (!video?.width || !video.height) throw new Error("No video stream")
  const duration = Number(data.format?.duration ?? video.duration)
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("Unknown duration")
  // Phones often store portrait video as landscape plus a rotation flag; ffmpeg autorotates.
  const rotation = Math.abs(Number(video.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? video.tags?.rotate ?? 0))
  const swap = rotation === 90 || rotation === 270
  return {
    durationSec: duration,
    width: swap ? video.height : video.width,
    height: swap ? video.width : video.height,
    hasAudio: Boolean(data.streams?.some((s) => s.codec_type === "audio")),
  }
}

/** One HLS rendition. Even dimensions are required by H.264. */
export function hlsArgs(input: string, outDir: string, height: number, hasAudio: boolean): string[] {
  return [
    "-y", "-i", input,
    "-vf", `scale=-2:${height}`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-profile:v", "main", "-pix_fmt", "yuv420p",
    ...(hasAudio ? ["-c:a", "aac", "-b:a", "96k", "-ac", "2"] : ["-an"]),
    "-f", "hls", "-hls_time", "4", "-hls_playlist_type", "vod",
    "-hls_segment_filename", `${outDir}/${height}p/seg_%03d.ts`,
    `${outDir}/${height}p/index.m3u8`,
  ]
}

export function masterPlaylist(probe: Probe): string {
  const lines = ["#EXTM3U", "#EXT-X-VERSION:3"]
  for (const r of RENDITIONS) {
    const width = Math.max(2, Math.round((r.height * (probe.width / probe.height)) / 2) * 2)
    lines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${r.bandwidth},RESOLUTION=${width}x${r.height}`, `${r.height}p/index.m3u8`)
  }
  return lines.join("\n") + "\n"
}

/** A poster frame from about a fifth of the way in, avoiding a black first frame. */
export function posterArgs(input: string, output: string, durationSec: number): string[] {
  const at = Math.min(durationSec * 0.2, 3).toFixed(2)
  return ["-y", "-ss", at, "-i", input, "-frames:v", "1", "-vf", "scale=-2:720", "-q:v", "3", output]
}

/** `count` frames spread evenly across the video, small, for the angle check only. */
export function sampleFramesArgs(input: string, outPattern: string, count: number, durationSec: number): string[] {
  return ["-y", "-i", input, "-vf", `fps=${(count / durationSec).toFixed(5)},scale=-2:512`, "-frames:v", String(count), "-q:v", "5", outPattern]
}
