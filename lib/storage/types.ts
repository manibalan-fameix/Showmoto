export type PresignedUpload = { url: string; method: "PUT"; headers: Record<string, string> }

export interface StorageAdapter {
  readonly kind: "r2" | "local"
  /** A short-lived URL the browser PUTs the file to directly. */
  presignPut(key: string, contentType: string): Promise<PresignedUpload>
  /** Size in bytes if the object exists, else null. Used to verify an upload before trusting it. */
  head(key: string): Promise<{ size: number } | null>
  get(key: string): Promise<Buffer>
  put(key: string, body: Buffer, contentType: string): Promise<void>
  remove(key: string): Promise<void>
  /** URL a browser can load the object from. */
  publicUrl(key: string): string
}
