# PRD — Belmont Technologies Online Store

## 1. Product

**Shop:** Belmont Technologies — an online store selling software solutions and hardware parts
**Customers:** Individuals and small businesses who need software tools or computer/electronics hardware parts
**Goal:** A working online shop where a customer can sign in with Google, add products to a cart, check out, receive a confirmation email, and see their order history at any time.

## 2. Scope

### Must have (Lesson 2 requirements)
- Product listing page and product cards
- Add to cart, update quantity, remove from cart
- Checkout page
- Google sign-in (Supabase Auth with Google provider)
- Orders saved in Supabase Postgres, linked to the signed-in user
- "My Orders" page showing past orders
- Logout
- Confirmation email via Mailgun after a successful checkout (formatted HTML)
- Deployed to production with all integrations working

### Nice to have (only after the above works)
- Payments in test mode (Paystack, Flutterwave or Stripe)
- Order status updates, product search, simple admin page

### Out of scope
Inventory management, discounts, multiple shops, anything not listed above.

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Package manager | npm (Bun also works) |
| Auth | Supabase Auth, Google provider |
| Database | Supabase Postgres with Row Level Security |
| Email | Mailgun (HTTP API, called from a server route) |
| Hosting | Vercel |
| Cart state | Client-side (React context + localStorage) until checkout |

Single project: UI and API routes live together. Server-only logic lives in `/lib/server`.

## 4. User Flows

**Sign in:** Click "Sign in with Google" → Google consent → Supabase callback → back to the site, signed in.

**Checkout:**
1. Signed-in user opens the cart and clicks Checkout.
2. The client sends cart items (product IDs and quantities) to `POST /api/checkout`.
3. The server verifies the session, loads real prices from the database (never trust client prices), and creates an `order` and `order_items`.
4. The server sends the confirmation email through Mailgun.
5. The user lands on an order confirmation page.

**Order history:** Signed-in user opens "My Orders" → server fetches orders where `user_id` is the current user → persists across logout and re-login because it lives in the database.

## 5. Catalog

Two categories, with a filter on the shop page:
- **Software solutions** (digital): e.g. POS system licence, inventory management tool, website/app development package, IT support plan.
- **Hardware parts** (physical): e.g. SSDs, RAM, power supplies, keyboards, routers, cables.

Seed 8 to 12 products across both categories. Keep it simple for now: one flat price per product, no variants, no shipping calculation. Software items are delivered by email or contact; hardware is collected or arranged after the order.

## 6. Data Model

```sql
products (id, name, description, category, price_cents, image_url, in_stock, created_at)
-- category: 'software' | 'hardware'
orders (id, user_id -> auth.users, email, total_cents, status, created_at)
order_items (id, order_id -> orders, product_id -> products, name, unit_price_cents, quantity)
```

- Prices stored in the smallest currency unit as integers.
- `order_items` copies name and price at purchase time so old orders never change.
- RLS: products are readable by everyone; orders and order_items are readable only by their owner. Writes happen server-side.

## 7. Environment Variables

Names only, values go in `.env.local` and Vercel settings. Never commit values.

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY      # server only
MAILGUN_API_KEY                # server only
MAILGUN_DOMAIN
MAILGUN_FROM_EMAIL
NEXT_PUBLIC_SITE_URL           # localhost in dev, production URL in prod
```

Google client ID and secret are entered in the Supabase dashboard (Auth → Providers → Google), not in the app code.

## 8. Human-Only Setup (you do these, AI guides you)

1. Create a Supabase project and run `db/schema.sql`.
2. Create a Google Cloud OAuth client; add the Supabase callback URL as an authorised redirect URI; paste the client ID and secret into Supabase.
3. Create a Mailgun account and domain (a sandbox domain works for testing, but it only emails authorised recipients).
4. Deploy to Vercel, add all env vars, and add the production URL to Supabase's Site URL and Redirect URLs.

## 9. Build Phases

1. Scaffold the Next.js project and commit
2. Product UI (seed products, list page, product cards)
3. Supabase setup and schema
4. Google authentication, with sign in and out working locally
5. Cart
6. Checkout API and order persistence
7. My Orders page
8. Mailgun confirmation email
9. Deploy to Vercel, set production env vars and redirect URLs
10. End-to-end production test (see below)

## 10. Acceptance Tests (run on the production URL)

- [ ] Sign in with Google works
- [ ] Place an order; it appears in My Orders
- [ ] Confirmation email arrives and looks good
- [ ] Log out works
- [ ] Close the browser, reopen, sign in again; previous orders are still there
- [ ] No secrets in the GitHub repo
- [ ] No `localhost` URLs in production code

## 11. Risks

- Google redirect mismatch in production: add the production URL in both Google Cloud and Supabase.
- Mailgun sandbox only sends to authorised recipients: verify a real domain, or add test recipients.
- Email failure must not lose the order: save the order first, send the email second, and log failures.
