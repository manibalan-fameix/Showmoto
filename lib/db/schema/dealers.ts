import { index, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core"

import type { BusinessHours } from "../../hours"
import type { DealerTheme } from "../../theme/tokens"
import { dealerRole } from "./enums.ts"
import { users } from "./auth.ts"

export const dealers = pgTable("dealers", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  logoUrl: text("logo_url"),
  theme: jsonb("theme").$type<DealerTheme>().notNull(),
  plan: text("plan").notNull().default("starter"),
  city: text("city").notNull().default("Chennai"),
  phone: text("phone"),
  // Added beyond the spec: test-drive slots come from configured hours (7.2).
  businessHours: jsonb("business_hours").$type<BusinessHours>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const dealerDomains = pgTable(
  "dealer_domains",
  {
    dealerId: uuid("dealer_id").notNull().references(() => dealers.id, { onDelete: "cascade" }),
    hostname: text("hostname").notNull().unique(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
  },
  (t) => [index("dealer_domains_dealer_idx").on(t.dealerId)],
)

export const dealerUsers = pgTable(
  "dealer_users",
  {
    dealerId: uuid("dealer_id").notNull().references(() => dealers.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: dealerRole("role").notNull().default("staff"),
  },
  (t) => [primaryKey({ columns: [t.dealerId, t.userId] }), index("dealer_users_user_idx").on(t.userId)],
)
