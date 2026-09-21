# Decisions

Choices made without asking, newest first within each phase. Reverse any of them if you disagree.

## Phase 1

**Conflicts with the prompt (preset or framework wins)**
- `middleware.ts` is `proxy.ts` in Next 16 (Node runtime, `proxy` export). Same behaviour.
- Tenant routes live at `app/(tenant)/sites/[dealer]/`, not `[dealer]/`. A bare `[dealer]` segment would be reachable directly at `/{slug}` on any host and could shadow admin routes. The proxy rewrites into `/sites/{slug}` and returns 404 for any direct request to `/sites/*`.
- Theme provider (and the `d` dark-mode hotkey) moved from the root layout to the admin layout. Buyer pages stay light and use only the dealer's tokens.
- Package manager is pnpm (repo standard); shadcn components added with `pnpm dlx shadcn@latest add`.
- shadcn here is Base UI based (`render` prop, not `asChild`).
- pnpm build scripts: `esbuild` install script denied in `pnpm-workspace.yaml`; its binary comes from optional deps and everything works.
- ESLint 10 crashes in `eslint-plugin-react` version auto-detection; React version is pinned in `eslint.config.mjs`.

**Dependencies**
- Added from Section 2: drizzle-orm, drizzle-kit, zod, next-auth (Auth.js v5 beta), vitest.
- Added implied by Section 2 but not named: `pg` (Postgres driver, also what pg-boss uses), `@auth/drizzle-adapter`, `@types/pg`.
- No `tsx`. Scripts run on Node 24 native TypeScript, so schema files use explicit `.ts` import specifiers and `allowImportingTsExtensions` is on.

**Schema additions beyond Section 6**
- `dealers.business_hours` (jsonb) for test-drive slots.
- `leads.consent_at` (not null) to record DPDP consent.
- `cars.variant_id` is nullable: a draft exists before the dealer picks a variant match.
- `dealers.theme` holds colours and radius only. Name and logo stay in their own columns rather than duplicating them in the jsonb.
- Auth.js `users` and `accounts` tables; sessions are JWT, so no sessions table.
- `price_events.car_id` has no cascade and a DB trigger blocks UPDATE, DELETE and TRUNCATE. Cars with history are archived, never hard-deleted.
- The 12 photo angles: front 3/4, rear 3/4, left side, right side, dashboard, odometer, front seats, rear seats, boot, engine bay, front tyres, rear tyres. Section 7.1 lists nine named angles plus "each tyre group"; this is my reading of the count. Adding an enum value later is a cheap migration.

**Tenancy**
- `scopedDb(dealerId)` is the only data access for app code. ESLint blocks importing the raw client from `app/`, `components/`, `hooks/` and `proxy.ts`. Update and delete require an explicit `where`; `dealer_id` and `car_id` are stripped from update payloads at runtime.
- Child tables (media, RC lookups, views, transfers, price events) have no `dealer_id`, so they scope through an ownership subquery on `cars`.
- `dealers` and the auth tables are read through the raw client only in `lib/tenant` and `lib/auth`.
- A test fails when any table gains `dealer_id` or `car_id` without being registered as tenant-scoped.
- Reserved subdomains: `app`, `www`, `api`, `admin` and others in `lib/tenant/host.ts`. Only one label deep.
- Custom domains resolve only when `verified_at` is set and the plan allows them. Cached in memory for 60 seconds. Cloudflare for SaaS provisioning is a TODO in `lib/tenant/dealer.ts`.
- The proxy strips any client-supplied `x-tenant-slug` and sets its own. Tenant hosts can reach `/api/t/*` only; everything else under `/api` is 404 there.

**Plans (no billing)**
- starter 20 cars, growth 50, pro 100, scale 1000 (the "100+" tier). White label and custom domain on for pro and scale. Adjust in `lib/plans.ts`.

**Other**
- Product name in copy is "Fameix" (from the repo name). Change in `lib/copy.ts`.
- Theme validation: text colours are auto-adjusted to WCAG AA (4.5:1). A primary colour under 3:1 against white is rejected because buttons and links would vanish. The "near-black" fallback goes to pure black in the mid-tone band where near-black cannot reach 4.5:1.
- Radius options: none, sm, md (preset default), lg.
- A user belongs to one dealer in v1; if several links exist the earliest wins.
