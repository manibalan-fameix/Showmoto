import { describe, expect, it } from "vitest"

import { formatReg, isValidReg, normalizeReg, regPrefix, repairOcrReg } from "../lib/reg"

describe("registration numbers", () => {
  it("normalises spacing, case, dashes and pads a 1-digit RTO code", () => {
    expect(normalizeReg("tn 11 ab 1234")).toBe("TN11AB1234")
    expect(normalizeReg("TN-09-CD-5678")).toBe("TN09CD5678")
    expect(normalizeReg("tn9ab1234")).toBe("TN09AB1234")
  })
  it("validates standard and Bharat series plates", () => {
    for (const ok of ["TN11AB1234", "TN 09 A 1234", "TN22 1234", "MH12DE1433", "22BH1234AA"]) expect(isValidReg(ok)).toBe(true)
    for (const bad of ["", "ABC", "TN11", "1234567890", "TN11AB12345"]) expect(isValidReg(bad)).toBe(false)
  })
  it("derives the lowercase URL prefix", () => {
    expect(regPrefix("TN11AB1234")).toBe("tn11")
    expect(regPrefix("tn9 ab 1234")).toBe("tn09")
    expect(regPrefix("22BH1234AA")).toBe("bh")
    expect(regPrefix("garbage")).toBe("")
  })
  it("formats for display", () => {
    expect(formatReg("TN11AB1234")).toBe("TN 11 AB 1234")
    expect(formatReg("tn09 1234")).toBe("TN 09 1234")
  })
})

describe("OCR repair", () => {
  it("fixes letter/digit confusions by position", () => {
    expect(repairOcrReg("TNl1ABl234")).toBe("TN11AB1234") // l -> 1
    expect(repairOcrReg("TN11A8I234")).toBe("TN11AB1234") // 8 -> B in the series, I -> 1
    expect(repairOcrReg("TN0SCD5678")).toBe("TN05CD5678") // S -> 5
    expect(repairOcrReg("7N11AB1234")).toBe("7N11AB1234") // unknown char left alone
  })
  it("leaves already-correct plates untouched", () => {
    expect(repairOcrReg("TN11AB1234")).toBe("TN11AB1234")
    expect(repairOcrReg("tn 11 ab 1234")).toBe("TN11AB1234")
  })
  it("returns the cleaned text unchanged when it cannot fit the format", () => {
    expect(repairOcrReg("TN11")).toBe("TN11")
    expect(repairOcrReg("TN11ABCDE12345")).toBe("TN11ABCDE12345")
  })
})
