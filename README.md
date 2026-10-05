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
- Expo SDK 57 mobile app in `mobile/` (TypeScript + Expo Router) with a minimal Belmont shell, identity placeholders (`Belmont`, `com.belmont.store`), public-only `.env.example`, ESLint, and separate lint/typecheck/build tooling.
- Mobile API layer: `EXPO_PUBLIC_API_BASE_URL` config validation, a typed `fetch` client with optional bearer tokens and clear status/network errors, and a dependency-free test suite (`npm test`, Node's built-in runner).
- Mobile Supabase auth: persistent AsyncStorage session, PKCE Google sign-in through `expo-web-browser` with `belmont://auth-callback` deep linking, an `AuthProvider`/`useAuth` context, and sign-in/sign-out UI on the home screen.
- Mobile catalog: `useProducts` fetches the live `/api/products` feed; the home screen renders product cards with All/Software/Hardware filters, pull-to-refresh, and loading/error/empty states. NGN prices are formatted to match the web app.
- Cross-client cart sync: web `CartProvider` and mobile `useCart` subscribe to the signed-in user's `cart_items` Realtime changes and refetch on events, reconnect (`SUBSCRIBED`), window focus/visibility/online (web), and AppState `active` (mobile); subscriptions are scoped by `user_id` and torn down on sign-out/unmount.
- Mobile cart: app-wide `CartProvider` with add/quantity/remove/clear, a `/cart` screen with totals, anonymous carts persisted in AsyncStorage and merged into the server cart on sign-in (quantities capped at 99), and bearer-auth `PUT /api/cart` for signed-in edits.
- Mobile checkout and orders: `/cart` checks out through `POST /api/checkout` with the bearer token (client sends only product IDs and quantities; the server re-prices), then routes to an `/orders` screen that reads the shared order history through Supabase RLS.

## Local Status (verified)

- `npm ci` completes against the npm registry.
- `npm run lint` passes with no errors.
- `npm run build` succeeds (Next.js 16, Turbopack).
- `npm run dev` serves `/`, `/cart`, `/orders`, and `/api/products` with HTTP 200 using the sample catalog.
- Lint fixes: internal links use `next/link`; cart hydration uses `useSyncExternalStore`; auth-controls derives its not-configured state during render.

The app can be browsed now, but Google sign-in, saved orders, checkout, and email stay inactive until the external services below are configured.

## Still Needed

- Build and install the mobile **preview APK** (EAS) so Google sign-in uses the app's `belmont://` scheme instead of Expo Go's `exp://` redirect, then run the cross-client acceptance checks (MOB-060) and write the release handoff (MOB-061).
- Confirm `belmont://auth-callback` is in Supabase Auth → URL Configuration → Redirect URLs (already added), then smoke-test signed-in cart sync and checkout on the installed APK.
- Replace demo catalog names, images, and NGN prices with Belmont’s approved products and currency. Keep the SQL seed and `lib/products.ts` fallback catalog aligned.
- Run the end-to-end flows and complete the production acceptance checklist in the PRD.

## Environment Variables

See `.env.example`. Server-only values (`SUPABASE_SERVICE_ROLE_KEY`, `MAILGUN_API_KEY`) must never be exposed to client components. Google OAuth client values belong in Supabase Auth provider settings, not in this app’s environment file.

## Exact Next Step

Install `Belmont.apk` on the phone, sign in with Google, and verify the shared cart against the web app (see "Android APK from the web app (PWA / TWA)" below). Then complete MOB-060 (cross-client acceptance) and MOB-061 (release handoff). The Expo native path (EAS) is documented in `mobile/README.md` and can be revisited if a React Native build is explicitly required. Mailgun is exempt for the mobile lesson.

## Android APK from the web app (PWA / TWA)

The fastest path to an installable APK is to package the deployed website as a **Trusted Web Activity (TWA)**. The TWA runs the site in Chrome, so the existing Google sign-in, cart, and order history all work, and there is no deep-link/native-OAuth problem. Trade-off: it is the website in an app shell, not native screens.

The web app ships the PWA pieces:
- `app/manifest.ts` → `/manifest.webmanifest` (standalone display, icons, theme color)
- `public/icons/*` (192/512 + maskable + apple-touch)
- `public/sw.js` registered in production by `components/pwa-register.tsx`
- `public/.well-known/assetlinks.json` — TWA fingerprint (configured, verified)

**Status: packaged.** The site is deployed, PWABuilder produced the Android package, and the signing fingerprint is live in `assetlinks.json` (Google's Digital Asset Links API confirms the association, so the TWA runs full-screen).

**Artifacts** (all gitignored — never commit the keystore):
- `Belmont - Google Play package.zip` — PWABuilder output
- `Belmont.apk` — install on device / submission artifact
- `Belmont.aab` — Play Store bundle
- `signing.keystore` + `signing-key-info.txt` — **secrets; back these up**, losing them prevents shipping updates under the same package

**To install/test:** enable "install unknown apps" on the phone, install `Belmont.apk`, open it, and sign in with Google (the web flow runs in Chrome, so it works and the shared cart appears).

**To rebuild after code changes:** deploy the site, then re-run PWABuilder (or Bubblewrap, which needs a local JDK + Android SDK) and sign with the same keystore.

## Mobile App (Expo)

The native app lives in `mobile/` and shares the deployed API and Supabase project. To run it:

```bash
cd mobile
npm install
cp .env.example .env   # fill in public values (never server secrets)
ELECTRON_DISABLE_SANDBOX=1 npx expo start
```

Open the QR code with **Expo Go** on a phone connected to the same network, or press `w` for the web preview. Expo Go is fine for browsing, but **Google sign-in requires installing the built APK** (the `belmont://` scheme); see `mobile/README.md` → "Building an APK". `ELECTRON_DISABLE_SANDBOX=1` avoids a harmless Linux `chrome-sandbox` error from Expo's React Native DevTools probe. On this host, the npm registry blackholes IPv4; prefix network commands with `NODE_OPTIONS=--dns-result-order=ipv6first` if installs or CLI calls hang. The default dev port 8081 is already taken on this machine — let Expo pick 8082 (or pass `--port`).
