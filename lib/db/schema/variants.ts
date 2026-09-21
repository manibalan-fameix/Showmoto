import { index, integer, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core"

// Master spec table. Seeded from CSV, never user-editable, shared by all dealers.
export const variants = pgTable(
  "variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    make: text("make").notNull(),
    model: text("model").notNull(),
    variant: text("variant").notNull(),
    fuel: text("fuel").notNull(),
    transmission: text("transmission").notNull(),
    engineCc: integer("engine_cc"),
    yearFrom: integer("year_from").notNull(),
    yearTo: integer("year_to"),
    specs: jsonb("specs").$type<Record<string, Record<string, string | number | boolean>>>().notNull().default({}),
    features: jsonb("features").$type<Record<string, string[]>>().notNull().default({}),
  },
  (t) => [index("variants_make_model_idx").on(t.make, t.model)],
)
