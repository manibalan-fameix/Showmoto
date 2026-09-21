import { describe, expect, it, vi } from "vitest"

import { analyseAngles } from "../lib/video/analysis"
import { RENDITIONS, hlsArgs, masterPlaylist, parseProbe, posterArgs, probeArgs, sampleFramesArgs } from "../lib/video/ffmpeg"
import { CAR_ANGLES } from "../lib/angles"

const probeJson = (over: object = {}, streams: object[] | null = null) =>
  JSON.stringify({
    format: { duration: "42.5" },
    streams: streams ?? [{ codec_type: "video", width: 1920, height: 1080 }, { codec_type: "audio" }],
    ...over,
  })

describe("ffprobe parsing", () => {
  it("reads duration, size and audio", () => {
    expect(parseProbe(probeJson())).toEqual({ durationSec: 42.5, width: 1920, height: 1080, hasAudio: true })
  })
  it("swaps dimensions for phone videos stored sideways with a rotation flag", () => {
    const p = parseProbe(probeJson({}, [{ codec_type: "video", width: 1920, height: 1080, side_data_list: [{ rotation: -90 }] }]))
    expect(p).toMatchObject({ width: 1080, height: 1920, hasAudio: false })
  })
  it("rejects files that are not playable video", () => {
    expect(() => parseProbe(probeJson({}, [{ codec_type: "audio" }]))).toThrow(/No video stream/)
    expect(() => parseProbe(probeJson({ format: {} }))).toThrow(/duration/i)
    expect(() => parseProbe("not json")).toThrow()
  })
})

describe("ffmpeg argument builders", () => {
  it("never puts a file name where the shell could interpret it: args are a plain array", () => {
    const evil = "in; rm -rf ~ .mp4"
    expect(probeArgs(evil)).toContain(evil)
    expect(hlsArgs(evil, "/tmp/out", 360, true)).toContain(evil)
  })
  it("builds a VOD HLS rendition with even-dimension scaling and audio when present", () => {
    const a = hlsArgs("/in.mp4", "/o", 720, true)
    expect(a).toEqual(expect.arrayContaining(["-vf", "scale=-2:720", "-c:v", "libx264", "-c:a", "aac", "-hls_playlist_type", "vod"]))
    expect(a.at(-1)).toBe("/o/720p/index.m3u8")
    expect(hlsArgs("/in.mp4", "/o", 360, false)).toContain("-an")
    expect(hlsArgs("/in.mp4", "/o", 360, false)).not.toContain("aac")
  })
  it("master playlist lists both renditions with even widths", () => {
    const m = masterPlaylist({ durationSec: 10, width: 1920, height: 1080, hasAudio: true })
    expect(m).toContain("RESOLUTION=640x360")
    expect(m).toContain("RESOLUTION=1280x720")
    for (const r of RENDITIONS) expect(m).toContain(`${r.height}p/index.m3u8`)
    expect(masterPlaylist({ durationSec: 10, width: 1080, height: 1920, hasAudio: true })).toContain("RESOLUTION=202x360")
  })
  it("poster time stays inside short clips", () => {
    expect(posterArgs("/i", "/p.jpg", 5)).toContain("1.00")
    expect(posterArgs("/i", "/p.jpg", 100)).toContain("3.00")
  })
  it("samples the requested number of frames", () => {
    const a = sampleFramesArgs("/i", "/f%02d.jpg", 12, 60)
    expect(a).toContain("12")
    expect(a.join(" ")).toContain("fps=0.20000")
  })
})

describe("angle analysis", () => {
  const frame = { mediaType: "image/jpeg" as const, base64: "AAAA" }
  const vision = (seen: string[]) => ({ json: vi.fn(async () => ({ seen })) }) as never

  it("splits the 12 angles into seen and missing", async () => {
    const r = await analyseAngles(vision(["front_three_quarter", "boot", "dashboard"]), [frame])
    expect(r?.seen).toEqual(["front_three_quarter", "dashboard", "boot"])
    expect(r?.missing).toHaveLength(CAR_ANGLES.length - 3)
    expect(r?.missing).not.toContain("boot")
  })
  it("ignores anything the model says that is not a required angle", async () => {
    const r = await analyseAngles(vision(["hovercraft", "boot", "boot"]), [frame])
    expect(r?.seen).toEqual(["boot"])
  })
  it("returns null with no frames or when the model fails", async () => {
    expect(await analyseAngles(vision([]), [])).toBeNull()
    expect(await analyseAngles({ json: vi.fn(async () => null) } as never, [frame])).toBeNull()
  })
  it("sends the frames and the full angle list to the model", async () => {
    const json = vi.fn(async (_req: { images: unknown[]; prompt: string }) => ({ seen: [] as string[] }))
    await analyseAngles({ json } as never, [frame, frame])
    const req = json.mock.calls[0][0]
    expect(req.images).toHaveLength(2)
    for (const a of CAR_ANGLES) expect(req.prompt).toContain(a)
  })
})
