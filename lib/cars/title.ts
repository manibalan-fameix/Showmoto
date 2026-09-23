/** Buyer-facing car title: "<year> <make> <model> <variant>", dropping whichever half is missing. */
export const titleOf = (year: number | null, v: { make: string; model: string; variant: string } | null) =>
  [year, v && `${v.make} ${v.model} ${v.variant}`].filter(Boolean).join(" ")
