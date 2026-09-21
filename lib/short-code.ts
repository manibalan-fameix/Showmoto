import { randomInt } from "node:crypto"

// No 0/O/1/l/I: codes get read aloud and typed from Instagram captions.
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz"

export function generateShortCode(length = 5): string {
  let out = ""
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)]
  return out
}
