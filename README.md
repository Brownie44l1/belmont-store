# Belmont Technologies Online Store

An online store for software solutions and hardware parts. Built for HNG 15, Lesson 2.

Stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth and Postgres, Mailgun, and Vercel. See [PRD.md](./PRD.md) for the full brief and [AGENTS.md](./AGENTS.md) for project rules.

## Getting Started

```bash
npm ci
cp .env.example .env.local
npm run dev
```

The shop can be browsed with sample products before Supabase is configured. Google sign-in, saved orders, checkout, and email require the environment variables and external service setup below. Never commit `.env.local`.

## Implemented

- Responsive product catalogue with software/hardware filters and product search.
- Product listing and basket refresh from Supabase when configured, with sample catalog fallback for browsing.
- Browser-persisted basket with quantity editing and removal.
- Google OAuth callback, sign-in, and sign-out controls.
- Supabase schema, ownership-based RLS policies, and eight repeatable sample product seeds.
- Server-verified checkout. Prices are read from Postgres, and the order plus item snapshots are written atomically.
- “My Orders” history and post-checkout confirmation notice.
- Mailgun HTML confirmation email attempted after saving an order; email failures are logged and do not erase the order.
- Shared mobile delivery plan and ticket backlog in [MOBILE_PLAN.md](./MOBILE_PLAN.md) and [MOBILE_TICKETS.md](./MOBILE_TICKETS.md).
- Authenticated cart persistence API (`GET/PUT /api/cart`) and database cart schema with owner-scoped RLS; checkout now accepts web cookie sessions or verified Supabase bearer tokens.
- Web signed-in cart hydration/persistence with anonymous-cart merging and per-user local cart caches.

## Local Status (verified)

- `npm ci` completes against the npm registry.
- `npm run lint` passes with no errors.
- `npm run build` succeeds (Next.js 16, Turbopack).
- `npm run dev` serves `/`, `/cart`, `/orders`, and `/api/products` with HTTP 200 using the sample catalog.
- Lint fixes: internal links use `next/link`; cart hydration uses `useSyncExternalStore`; auth-controls derives its not-configured state during render.

The app can be browsed now, but Google sign-in, saved orders, checkout, and email stay inactive until the external services below are configured.

## Still Needed

- Retry Expo scaffold after npm registry access is restored. The scaffold command stalled before creating `mobile/`.
- Apply the updated `db/schema.sql` in Supabase, then smoke-test authenticated cart read/write and native bearer checkout.
- Implement Supabase Realtime subscriptions in web and mobile, plus focus/reconnect recovery.
- Implement the mobile auth, catalog, cart, checkout, and order history tickets in [MOBILE_TICKETS.md](./MOBILE_TICKETS.md).
- Configure Supabase, Google OAuth, and Vercel for the web app. Mailgun is already implemented but is exempt from the mobile lesson acceptance.
- Run `db/schema.sql` in the Supabase SQL Editor.
- Replace demo catalog names, images, and NGN prices with Belmont’s approved products and currency. Keep the SQL seed and `lib/products.ts` fallback catalog aligned.
- Run the end-to-end flows once credentials are configured.
- Deploy and complete the production acceptance checklist in the PRD.

## Environment Variables

See `.env.example`. Server-only values (`SUPABASE_SERVICE_ROLE_KEY`, `MAILGUN_API_KEY`) must never be exposed to client components. Google OAuth client values belong in Supabase Auth provider settings, not in this app’s environment file.

## Exact Next Step

Restore/check npm registry connectivity and rerun `npx create-expo-app@latest mobile --template blank-typescript` for ticket MOB-010. Separately, apply the updated `db/schema.sql` in Supabase so the completed cart API can be exercised against the real database. Mailgun is exempt for the mobile lesson and does not need setup for this work.
