/**
 * Indian registration number helpers.
 * Standard: SS NN [A-Z]{0,3} NNNN (e.g. TN 11 AB 1234). Bharat series: NN BH NNNN AA.
 */
const STANDARD = /^([A-Z]{2})(\d{1,2})([A-Z]{0,3})(\d{1,4})$/
const BHARAT = /^(\d{2})BH(\d{4})([A-Z]{2})$/

/** Uppercase, strip everything but letters and digits, pad a 1-digit RTO code (TN9 -> TN09). */
export function normalizeReg(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "")
  const m = STANDARD.exec(raw)
  if (m && m[2].length === 1) return `${m[1]}0${m[2]}${m[3]}${m[4]}`
  return raw
}

export function isValidReg(input: string): boolean {
  const n = normalizeReg(input)
  return BHARAT.test(n) || (STANDARD.test(n) && n.length >= 8 && n.length <= 11)
}

/** Lowercase RTO prefix used in the canonical URL (tn11). BH series has no RTO. */
export function regPrefix(input: string): string {
  const n = normalizeReg(input)
  if (BHARAT.test(n)) return "bh"
  const m = STANDARD.exec(n)
  return m ? `${m[1]}${m[2].padStart(2, "0")}`.toLowerCase() : ""
}

export function formatReg(input: string): string {
  const n = normalizeReg(input)
  const m = STANDARD.exec(n)
  return m ? [m[1], m[2].padStart(2, "0"), m[3], m[4]].filter(Boolean).join(" ") : n
}

const TO_DIGIT: Record<string, string> = { O: "0", Q: "0", D: "0", I: "1", L: "1", Z: "2", S: "5", G: "6", B: "8" }
const TO_LETTER: Record<string, string> = { "0": "O", "1": "I", "2": "Z", "5": "S", "6": "G", "8": "B" }

/**
 * Fix the classic OCR confusions (O/0, I/1, S/5, B/8, Z/2) using the format's positions:
 * two letters, two digits, 0-3 letters, four digits. Returns the input unchanged if the
 * length can't fit the format, so a bad read still reaches the dealer for manual correction.
 */
export function repairOcrReg(raw: string): string {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, "")
  const seriesLen = s.length - 8
  if (seriesLen < 0 || seriesLen > 3) return s
  const kinds = ["L", "L", "D", "D", ...Array(seriesLen).fill("L"), "D", "D", "D", "D"] as const
  return [...s]
    .map((ch, i) => {
      const isDigit = /\d/.test(ch)
      if (kinds[i] === "D" && !isDigit) return TO_DIGIT[ch] ?? ch
      if (kinds[i] === "L" && isDigit) return TO_LETTER[ch] ?? ch
      return ch
    })
    .join("")
}
