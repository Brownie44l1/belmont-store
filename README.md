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

## Local Status (verified)

- `npm ci` completes against the npm registry.
- `npm run lint` passes with no errors.
- `npm run build` succeeds (Next.js 16, Turbopack).
- `npm run dev` serves `/`, `/cart`, `/orders`, and `/api/products` with HTTP 200 using the sample catalog.
- Lint fixes: internal links use `next/link`; cart hydration uses `useSyncExternalStore`; auth-controls derives its not-configured state during render.

The app can be browsed now, but Google sign-in, saved orders, checkout, and email stay inactive until the external services below are configured.

## Still Needed

- Create/configure Supabase, Google OAuth, Mailgun, and Vercel accounts and enter their values in `.env.local` or deployment settings.
- Run `db/schema.sql` in the Supabase SQL Editor.
- Replace demo catalog names, images, and NGN prices with Belmont’s approved products and currency. Keep the SQL seed and `lib/products.ts` fallback catalog aligned.
- Run the end-to-end flows once credentials are configured.
- Deploy and complete the production acceptance checklist in the PRD.

## Environment Variables

See `.env.example`. Server-only values (`SUPABASE_SERVICE_ROLE_KEY`, `MAILGUN_API_KEY`) must never be exposed to client components. Google OAuth client values belong in Supabase Auth provider settings, not in this app’s environment file.

## Exact Next Step

Create a Supabase project, run `db/schema.sql` in its SQL Editor, then copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Continue with Google OAuth and Mailgun setup following steps 2–4 in the PRD’s Human-Only Setup section, then deploy to Vercel.
