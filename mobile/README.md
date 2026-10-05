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
- `npm run lint` — run Expo lint
- `npx tsc --noEmit` — typecheck

## Structure

- `src/app/` — Expo Router screens and layouts (routes only)
- `app.json` — app config (name, slug, scheme, bundle identifiers, icons)
