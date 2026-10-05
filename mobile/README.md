# Belmont Store — Mobile (Expo)

Expo + React Native + Expo Router app for the Belmont Technologies store. It shares the
deployed Next.js API and Supabase project with the web app. See the repository root
`MOBILE_PLAN.md` and `MOBILE_TICKETS.md` for the delivery plan.

## Setup

```bash
cd mobile
npm install
cp .env.example .env
npx expo start
```

Scan the QR code with **Expo Go** on a phone on the same Wi-Fi network. If the LAN is
blocked, start with `npx expo start --tunnel`. To use an emulator instead, run
`npx expo start --android` (requires Android Studio) or `npx expo start --ios` (macOS).

`EXPO_PUBLIC_*` values are inlined into the app bundle and are public by design. Never add
server secrets such as the Supabase service-role key or Mailgun keys to `.env`.

## Scripts

- `npm start` — start the Expo dev server
- `npm run android` / `npm run ios` / `npm run web` — start on a specific target
- `npm test` — run unit tests with Node's built-in test runner
- `npm run lint` — run Expo lint
- `npx tsc --noEmit` — typecheck

## Troubleshooting (Linux)

- **`React Native DevTools` sandbox error on start.** Expo probes a bundled Electron app
  (`chrome-sandbox` in `~/.cache/dotslash`) that is not setuid-root, so launching it can
  print a `SUID sandbox helper binary` fatal error. It does not stop Metro. To avoid it,
  start the dev server with the Chromium sandbox disabled:
  ```bash
  ELECTRON_DISABLE_SANDBOX=1 npx expo start
  ```
  (Alternatively, `sudo chown root:root <path>/chrome-sandbox && sudo chmod 4755
  <path>/chrome-sandbox` fixes it properly.)
- **Network commands hang.** This host blackholes IPv4 to the npm registry; prefix
  install/CLI commands with `NODE_OPTIONS=--dns-result-order=ipv6first`.

## Structure

- `src/app/` — Expo Router screens and layouts (routes only; `index` catalog, `cart`, `orders`)
- `src/components/` — presentational components (`product-card`, `category-filter`)
- `src/lib/` — API client, data/auth/cart providers (`config.ts`, `http.ts`, `api.ts`, `types.ts`, `format.ts`, `use-products.ts`, `use-orders.ts`, `cart.tsx`, `supabase.ts`, `auth.tsx`)
- `src/lib/*.test.ts` — unit tests run by `npm test`
- `app.json` — app config (name, slug, scheme, bundle identifiers, icons)
- `eas.json` — EAS Build profiles (`preview` produces the installable APK)

## Authentication

Google sign-in uses the web OAuth flow (`supabase.auth.signInWithOAuth` + `expo-web-browser`)
with the implicit flow, reusing the existing web Google provider. The session persists in
AsyncStorage and is refreshed while the app is active.

**Use a real build (APK), not Expo Go, for sign-in.** In Expo Go the OAuth redirect is an
`exp://<dev-server-ip>:<port>` deep link, which is tied to your laptop's IP and is handed
back to Expo Go unreliably by Android's Chrome Custom Tab. A build registers the app's own
`belmont://` scheme, so the redirect returns to the app reliably.

In **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**, add:

- `belmont://auth-callback` — required for builds (the app scheme in `app.json`)
- `exp://**` — only needed if you also want to try Expo Go

The Google provider needs no change; it keeps using the same web OAuth client.

## Building an APK (EAS)

`eas.json` defines a `preview` profile that produces an installable **APK** (this is also the
artifact to submit). You need an [Expo account](https://expo.dev/signup) for the cloud build.

1. Fill the public environment values in `eas.json` (both `preview` and `production` `env`
   blocks) from `mobile/.env`:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   These are public values that ship inside the app, not secrets.
2. Log in and build:
   ```bash
   cd mobile
   npx eas-cli@latest login
   npx eas-cli@latest build:configure   # first time only; links the EAS project
   npx eas-cli@latest build --platform android --profile preview
   ```
3. When the build finishes, EAS prints a URL to download the `.apk`. Install it on the phone
   (enable "install unknown apps") and test Google sign-in.

A *development* build (`expo-dev-client`) is optional and only speeds up JS iteration; a
preview APK is enough to test and to submit.


