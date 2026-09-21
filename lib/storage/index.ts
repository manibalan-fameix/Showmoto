import { createLocalStorage } from "./local.ts"
import { createR2Storage } from "./r2.ts"
import type { StorageAdapter } from "./types.ts"

export type { StorageAdapter } from "./types.ts"

let instance: StorageAdapter | null = null

/**
 * R2 when all R2_* keys are set. In development only, falls back to local disk so the add-car
 * flow works before keys exist. In production missing keys are an error, never a silent fallback.
 */
export function getStorage(env: Record<string, string | undefined> = process.env): StorageAdapter {
  if (instance && env === process.env) return instance
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } = env
  let adapter: StorageAdapter
  if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET && R2_PUBLIC_URL) {
    adapter = createR2Storage({
      accountId: R2_ACCOUNT_ID, accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY,
      bucket: R2_BUCKET, publicUrl: R2_PUBLIC_URL,
    })
  } else if (env.NODE_ENV === "development") {
    adapter = createLocalStorage()
  } else {
    throw new Error("Storage is not configured: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET and R2_PUBLIC_URL")
  }
  if (env === process.env) instance = adapter
  return adapter
}
