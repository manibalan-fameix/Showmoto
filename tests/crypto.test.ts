import { randomBytes } from "node:crypto"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { decrypt, decryptJson, encrypt, encryptJson } from "../lib/crypto"

const original = process.env.ENCRYPTION_KEY
beforeEach(() => {
  process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64")
})
afterEach(() => {
  process.env.ENCRYPTION_KEY = original
})

describe("crypto", () => {
  it("round-trips and never leaks plaintext", () => {
    const ct = encrypt("TN11AB1234")
    expect(ct).not.toContain("TN11AB1234")
    expect(decrypt(ct)).toBe("TN11AB1234")
  })
  it("uses a fresh IV each time", () => {
    expect(encrypt("x")).not.toBe(encrypt("x"))
  })
  it("round-trips JSON", () => {
    expect(decryptJson(encryptJson({ owners: 2 }))).toEqual({ owners: 2 })
  })
  it("detects tampering", () => {
    const [v, iv, tag, data] = encrypt("secret").split(":")
    const bad = Buffer.from(data, "base64")
    bad[0] ^= 1
    expect(() => decrypt([v, iv, tag, bad.toString("base64")].join(":"))).toThrow()
  })
  it("fails closed without a valid key", () => {
    delete process.env.ENCRYPTION_KEY
    expect(() => encrypt("x")).toThrow(/ENCRYPTION_KEY/)
    process.env.ENCRYPTION_KEY = "short"
    expect(() => encrypt("x")).toThrow(/32 bytes/)
  })
})
