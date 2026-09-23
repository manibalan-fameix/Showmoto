// Demo data: two dealers with clearly different themes, a few cars each.
// Run: pnpm db:seed   (needs DATABASE_URL and ENCRYPTION_KEY; loads .env.local automatically)
// Idempotent: safe to run twice. Uses Node's native TypeScript support, hence explicit .ts imports.
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import { encrypt } from "../lib/crypto/index.ts"
import { users } from "../lib/db/schema/auth.ts"
import { cars, priceEvents } from "../lib/db/schema/cars.ts"
import { dealerDomains, dealerUsers, dealers } from "../lib/db/schema/dealers.ts"
import { generateShortCode } from "../lib/short-code.ts"

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set")
if (!process.env.ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY is not set. Generate one with: openssl rand -base64 32")
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool)

const demoDealers = [
  {
    slug: "sri-murugan",
    displayName: "Sri Murugan Motors",
    city: "Chennai",
    phone: "+919000000001",
    plan: "starter",
    theme: { primary: "#1d4ed8", primaryForeground: "#ffffff", accent: "#f5b400", radius: "lg" as const },
  },
  {
    slug: "chennai-prime",
    displayName: "Chennai Prime Cars",
    city: "Chennai",
    phone: "+919000000002",
    plan: "pro",
    theme: { primary: "#7a1f5c", primaryForeground: "#ffffff", accent: "#00a6a6", radius: "none" as const },
  },
]

const demoCars = [
  { year: 2017, reg: "TN11AB1234", km: 48200, owners: 1, fuel: "Petrol", trans: "Manual", price: 565000, slug: "2017-maruti-baleno-alpha-tn11" },
  { year: 2019, reg: "TN09CD5678", km: 31500, owners: 1, fuel: "Diesel", trans: "Automatic", price: 1125000, slug: "2019-hyundai-creta-sx-tn09" },
  { year: 2015, reg: "TN22EF9012", km: 72000, owners: 2, fuel: "Petrol", trans: "Manual", price: 345000, slug: "2015-honda-city-vx-tn22" },
]

try {
  for (const d of demoDealers) {
    const [dealer] = await db
      .insert(dealers)
      .values(d)
      .onConflictDoUpdate({
        target: dealers.slug,
        set: { displayName: d.displayName, theme: d.theme, plan: d.plan, phone: d.phone },
      })
      .returning()

    // Two live cars and one draft per dealer. Existing cars are left alone (price history is immutable).
    for (const [i, c] of demoCars.entries()) {
      const slug = `${d.slug}-${c.slug}`.slice(0, 80)
      const [car] = await db
        .insert(cars)
        .values({
          dealerId: dealer.id,
          year: c.year,
          regNumber: encrypt(c.reg),
          regPrefix: c.reg.slice(0, 4).toLowerCase(),
          kmDriven: c.km,
          ownerCount: c.owners,
          fuel: c.fuel,
          transmission: c.trans,
          askingPrice: c.price,
          status: i < 2 ? "live" : "draft",
          shortCode: generateShortCode(),
          slug,
          listedAt: i < 2 ? new Date() : null,
        })
        .onConflictDoNothing()
        .returning()
      if (car && i < 2) await db.insert(priceEvents).values({ carId: car.id, event: "listed", price: c.price })
    }
    console.log(`seeded ${dealer.slug} (${dealer.plan})`)
  }

  // Custom-domain demo for the paid-tier dealer. verified_at set by hand until Cloudflare for SaaS is wired.
  const [prime] = await db.select().from(dealers).where(eq(dealers.slug, "chennai-prime"))
  await db
    .insert(dealerDomains)
    .values({ dealerId: prime.id, hostname: "cars.chennaiprime.test", verifiedAt: new Date() })
    .onConflictDoNothing()

  // Optional: make yourself the owner of the first dealer so Google sign-in lands on a dashboard.
  const ownerEmail = process.env.SEED_OWNER_EMAIL?.toLowerCase()
  if (ownerEmail) {
    const [user] = await db
      .insert(users)
      .values({ email: ownerEmail })
      .onConflictDoUpdate({ target: users.email, set: { email: ownerEmail } })
      .returning()
    const [first] = await db.select().from(dealers).where(eq(dealers.slug, "sri-murugan"))
    await db.insert(dealerUsers).values({ dealerId: first.id, userId: user.id, role: "owner" }).onConflictDoNothing()
    console.log("linked owner", "(email from SEED_OWNER_EMAIL)")
  }
} finally {
  await pool.end()
}
