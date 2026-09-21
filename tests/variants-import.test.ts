import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { parseCsv } from "../lib/variants/csv"
import { parseVariantCsv } from "../lib/variants/import"

describe("parseCsv", () => {
  it("handles quotes, embedded commas, quotes and newlines, CRLF and BOM", () => {
    const rows = parseCsv('﻿a,b\r\n"x, y","he said ""hi"""\r\n"line1\nline2",z\r\n')
    expect(rows).toEqual([["a", "b"], ["x, y", 'he said "hi"'], ["line1\nline2", "z"]])
  })
  it("skips blank lines", () => {
    expect(parseCsv("a,b\n\n\n1,2\n")).toEqual([["a", "b"], ["1", "2"]])
  })
})

const HEAD = "make,model,variant,fuel,transmission,engine_cc,year_from,year_to"

describe("parseVariantCsv", () => {
  it("parses a row and normalises fuel and transmission", () => {
    const { variants, errors } = parseVariantCsv(`${HEAD}\nMaruti Suzuki,Baleno,Alpha,diesel,MT,1248,2015,2019\n`)
    expect(errors).toEqual([])
    expect(variants[0]).toMatchObject({ fuel: "Diesel", transmission: "Manual", engineCc: 1248, yearFrom: 2015, yearTo: 2019 })
  })
  it("treats blank year_to as still on sale", () => {
    const { variants } = parseVariantCsv(`${HEAD}\nKia,Seltos,HTK,Petrol,Manual,1497,2019,\n`)
    expect(variants[0].yearTo).toBeNull()
  })
  it("supports spec.* and features.* extension columns", () => {
    const csv = `${HEAD},spec.Engine.Max power (bhp),features.Safety\nKia,Seltos,HTK,Petrol,Manual,1497,2019,,113.4,ABS|Airbags|ESC\n`
    const { variants, errors } = parseVariantCsv(csv)
    expect(errors).toEqual([])
    expect(variants[0].specs).toEqual({ Engine: { "Max power (bhp)": 113.4 } })
    expect(variants[0].features).toEqual({ Safety: ["ABS", "Airbags", "ESC"] })
  })
  it("reports row-level problems with line numbers instead of importing partial junk", () => {
    const { variants, errors } = parseVariantCsv(`${HEAD}\nKia,Seltos,HTK,Steam,Manual,1497,2019,\n,Seltos,HTX,Petrol,Manual,1497,2019,\nKia,Seltos,GTX,Petrol,Manual,1497,2019,2010\n`)
    expect(variants).toHaveLength(0)
    expect(errors.map((e) => e.line)).toEqual([2, 3, 4])
    expect(errors[0].message).toMatch(/unknown fuel/)
  })
  it("flags missing columns, unknown columns and duplicates", () => {
    expect(parseVariantCsv("make,model\nA,B\n").errors[0].message).toMatch(/Missing columns/)
    expect(parseVariantCsv(`${HEAD},colour\nKia,Seltos,HTK,Petrol,Manual,1497,2019,,red\n`).errors[0].message).toMatch(/Unknown column/)
    const dup = parseVariantCsv(`${HEAD}\nKia,Seltos,HTK,Petrol,Manual,1497,2019,\nKia,Seltos,HTK,Petrol,Manual,1497,2019,\n`)
    expect(dup.errors.some((e) => /duplicate/.test(e.message))).toBe(true)
  })
})

describe("shipped seed file", () => {
  const { variants, errors } = parseVariantCsv(readFileSync("data/variants/chennai-top40.csv", "utf8"))
  it("has no errors or duplicate keys", () => expect(errors).toEqual([]))
  it("covers at least 40 models across the seven target makes", () => {
    expect(new Set(variants.map((v) => `${v.make}|${v.model}`)).size).toBeGreaterThanOrEqual(40)
    expect([...new Set(variants.map((v) => v.make))].sort()).toEqual(
      ["Honda", "Hyundai", "Kia", "Mahindra", "Maruti Suzuki", "Tata", "Toyota"],
    )
  })
})
