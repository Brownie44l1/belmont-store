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

- `src/app/` — Expo Router screens and layouts (routes only)
- `src/components/` — presentational components (`product-card`, `category-filter`)
- `src/lib/` — API client, data hooks, and auth (`config.ts`, `http.ts`, `api.ts`, `types.ts`, `format.ts`, `use-products.ts`, `supabase.ts`, `auth.tsx`)
- `src/lib/*.test.ts` — unit tests run by `npm test`
- `app.json` — app config (name, slug, scheme, bundle identifiers, icons)

## Authentication

Google sign-in uses the web OAuth flow (`supabase.auth.signInWithOAuth` + `expo-web-browser`)
with the PKCE flow, so it works in Expo Go and reuses the existing web Google provider — no
native Google client ID or development build is required. The session persists in AsyncStorage
and is refreshed while the app is active.

Before sign-in works on device, add these to **Supabase Dashboard → Authentication → URL
Configuration → Redirect URLs**:

- `exp://**` — required for Expo Go (the exact host/port changes each session)
- `belmont://auth-callback` — for development/standalone builds using the app scheme

The Google provider needs no change; it keeps using the same web OAuth client.
