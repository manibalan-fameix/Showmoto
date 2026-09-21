export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"

/** Per-day open/close in 24h "HH:mm"; a missing day means closed. */
export type BusinessHours = Partial<Record<DayKey, { open: string; close: string }>>
