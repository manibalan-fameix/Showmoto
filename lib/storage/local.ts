import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import path from "node:path"

import type { StorageAdapter } from "./types.ts"

/** Development-only stand-in for R2, writing under .local-uploads/. Never used in production. */
export const LOCAL_ROOT = path.resolve(process.cwd(), ".local-uploads")

/** Resolve a storage key to a file path, refusing anything that escapes the root. */
export function localPath(key: string): string | null {
  if (!key || key.includes("\0")) return null
  const full = path.resolve(LOCAL_ROOT, key)
  return full.startsWith(LOCAL_ROOT + path.sep) ? full : null
}

export function createLocalStorage(): StorageAdapter {
  const need = (key: string) => {
    const p = localPath(key)
    if (!p) throw new Error("Invalid storage key")
    return p
  }
  return {
    kind: "local",
    async presignPut(key) {
      need(key)
      return { url: `/api/dev-storage/${key}`, method: "PUT", headers: {} }
    },
    async head(key) {
      try {
        return { size: (await stat(/* turbopackIgnore: true */ need(key))).size }
      } catch {
        return null
      }
    },
    get: async (key) => readFile(/* turbopackIgnore: true */ need(key)),
    async put(key, body) {
      const p = need(key)
      await mkdir(path.dirname(p), { recursive: true })
      await writeFile(p, body)
    },
    async remove(key) {
      await rm(need(key), { force: true })
    },
    publicUrl: (key) => `/api/t/media/${key}`,
  }
}
