<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

Persistent instructions for any AI coding agent working on this repo. Read this and `PRD.md` before doing anything.

## Project
Belmont Technologies: an online store selling software solutions and hardware parts. Full spec is in `PRD.md`.

## Stack
- Next.js (App Router) + TypeScript + Tailwind
- npm as package manager (`npm install`, `npm run dev`). Bun also works if preferred.
- Supabase: Auth (Google provider) and Postgres, using `@supabase/ssr`
- Mailgun for email, called only from server code
- Deployed on Vercel

## Structure
```
/app              pages and API routes
/app/api/checkout checkout route handler
/app/auth/callback Supabase OAuth callback
/components       UI components
/lib/supabase     browser and server Supabase clients (client.ts, server.ts)
/lib/server       server-only logic (orders, mailgun)
/db/schema.sql    database schema and RLS policies
```

## Rules
1. **Never commit secrets.** Use environment variables only. Keep `.env.local` in `.gitignore`. Update `.env.example` with names only when adding a variable.
2. **Never trust client-sent prices.** The checkout route reads prices from the database.
3. **Server-only keys** (`SUPABASE_SERVICE_ROLE_KEY`, `MAILGUN_API_KEY`) must never be imported into client components.
4. **No hardcoded `localhost` URLs.** Use `NEXT_PUBLIC_SITE_URL` or relative paths.
5. **Order first, email second.** Save the order, then send the email. An email failure must be logged, not break checkout.
6. **Keep it simple.** Finish the required features in `PRD.md` before adding extras.
7. Use TypeScript types, small components, and clear names.
8. Make small, meaningful Git commits (e.g. `feat: add cart context`).

## Workflow
- Work through the build phases in `PRD.md` in order, one phase at a time.
- When you need a value from an external service (Supabase, Google Cloud, Mailgun, Vercel), stop and give the user beginner-friendly, click-by-click instructions. Do not invent credentials.
- After changes, run the build and fix errors before finishing.

## End of Every Session
Update `README.md` with: what was done, what is working, what is broken, and the exact next step. Another model should be able to continue from there without any other context.

## Current Status
Phase 1 done: project scaffolded, Supabase client helpers in place. Next: Phase 2, product UI.
