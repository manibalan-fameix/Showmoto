import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

const VERSION = "v1"

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) throw new Error("ENCRYPTION_KEY is not set")
  const key = Buffer.from(raw, "base64")
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes, base64 encoded")
  return key
}

/** AES-256-GCM. Output: v1:<iv>:<tag>:<ciphertext>, all base64. */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv)
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  return [VERSION, iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(":")
}

export function decrypt(payload: string): string {
  const [version, iv, tag, data] = payload.split(":")
  if (version !== VERSION || !iv || !tag || !data) throw new Error("Unrecognised ciphertext format")
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(iv, "base64"))
  decipher.setAuthTag(Buffer.from(tag, "base64"))
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8")
}

export const encryptJson = (value: unknown) => encrypt(JSON.stringify(value))
export const decryptJson = <T>(payload: string): T => JSON.parse(decrypt(payload)) as T

/**
 * Decrypt for display. If the key changed or the value is corrupt, return null instead of
 * throwing, so one unreadable row cannot take a whole page down. Never logs the value.
 */
export function tryDecrypt(payload: string | null | undefined): string | null {
  if (!payload) return null
  try {
    return decrypt(payload)
  } catch {
    console.error("could not decrypt a stored value (wrong ENCRYPTION_KEY or corrupted data)")
    return null
  }
}
