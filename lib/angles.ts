export const CAR_ANGLES = [
  "front_three_quarter",
  "rear_three_quarter",
  "side_left",
  "side_right",
  "dashboard",
  "odometer",
  "front_seats",
  "rear_seats",
  "boot",
  "engine_bay",
  "tyres_front",
  "tyres_rear",
] as const
export type CarAngle = (typeof CAR_ANGLES)[number]

/** The first angle is the hero image: publishing waits for it, everything else can fill in later. */
export const HERO_ANGLE: CarAngle = "front_three_quarter"

export const isAngle = (v: unknown): v is CarAngle => (CAR_ANGLES as readonly unknown[]).includes(v)
export const angleOrder = (a: CarAngle) => CAR_ANGLES.indexOf(a)
