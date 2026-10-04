# Belmont Mobile Shop Delivery Plan

## Goal

Deliver an iOS and Android shop that uses the existing Belmont web backend and Supabase project. Web and mobile users share accounts, catalog, orders, and a persisted cart. A cart change made in either signed-in client should appear in the other while it is active.

## Decisions

- Keep the existing Next.js application and API at the repository root. Add the Expo application in `mobile/` with its own `package.json` and lockfile.
- Keep the deployed Next.js API as the shared API. Mobile uses `GET /api/products`, `GET/PUT /api/cart`, and `POST /api/checkout`.
- Use the same Supabase Auth project and Google provider. Web retains its cookie session; the native app stores its Supabase session using AsyncStorage and sends its access token as a bearer token to protected API routes.
- Persist authenticated carts in Supabase. Retain browser/mobile local storage for anonymous and offline state, but use the server cart as the signed-in source of truth.
- Use Supabase Realtime Postgres Changes to notify clients of cart changes. The clients still make mutations over HTTPS; Realtime is a refresh signal, not the durable data store.
- Fetch the current cart on launch, focus, and reconnect as a recovery path for missed events. A short-lived subscription is active only while the app is in use.
- For the first release, merge the anonymous cart into the user's server cart at sign-in by adding quantities per product, capped at 99. For concurrent edits, the last successful server write wins for each full-cart update; clients refetch after updates and reconnects.
- Do not implement Mailgun/email work for this lesson. Existing email code can remain untouched; it is not a mobile delivery requirement or acceptance criterion.
- Do not put Supabase service-role or Mailgun credentials in the mobile app. Only public Supabase URL/key and the public API base URL are mobile configuration.

## Architecture

```text
Web (Next.js) --------------------\
  cookie auth, web UI               \
                                    +--> Next.js API --> Supabase Auth/Postgres
Mobile (Expo / React Native) ------/          |                 |
  native auth, bearer token                    |                 +--> Realtime event
                                               +--> verified identity
```

The database remains authoritative. The cart API validates payloads and associates them with the verified user. Row-level security restricts direct client reads/subscriptions to that user's rows. Realtime events cause a refetch rather than carrying trusted cart state. Checkout continues to calculate prices and create orders on the server.

## Delivery Phases: 0 to 100

### Phase 0: Scope and access

Confirm the app name/package IDs, supported device targets, API production URL, Supabase project, Google OAuth provider, and whether existing users can sign in on both platforms. Create development accounts/devices as needed. The lesson explicitly exempts Mailgun.

**Exit:** required non-secret project settings and human-owned accounts are available; no secrets are committed.

### Phase 1: Mobile foundation

Create the Expo TypeScript app under `mobile/`, add Expo Router, establish shared design tokens and navigation, configure environment handling, and document local setup. Confirm it launches on at least one iOS or Android simulator/device.

**Exit:** clean install and app launch work; root web app remains independently installable and buildable.

### Phase 2: Shared identity and catalog

Configure a native Supabase client with persistent session storage and Google OAuth deep links. Build signed-in/signed-out states and sign-out. Load the catalog from the existing API and support product browsing/filtering.

**Exit:** the same test account can sign into web and mobile; mobile catalog reflects the web API.

### Phase 3: Authenticated shared-cart API

Add a user-owned cart representation and RLS policies. Add `GET /api/cart` and `PUT /api/cart`. Centralize API identity resolution so protected routes accept either the current web cookie session or a verified Supabase bearer token. Update checkout to accept both forms without changing its server-side price validation.

**Exit:** API tests cover anonymous rejection, malformed cart rejection, user isolation, and cookie/bearer identity paths; database migration is applied to the shared Supabase project.

### Phase 4: Cross-client synchronization

Update the web cart to hydrate and persist the signed-in server cart while retaining anonymous local storage. Add merge-on-sign-in behavior. Subscribe web and mobile to the signed-in user's cart changes through Supabase Realtime and refetch on launch/focus/reconnect.

**Exit:** with the same account open in both clients, add/update/remove in one client appears in the other; after network interruption both recover from the persisted cart.

### Phase 5: Mobile shopping and checkout

Build product browse, cart editing, sign-in prompt, checkout, order confirmation, and order history. Reuse `/api/checkout`; obtain and send the native access token. Never calculate or trust order prices on the client.

**Exit:** a mobile order appears in the same account's web order history, and a web order appears in mobile history.

### Phase 6: Release readiness

Run lint/build/typecheck and cross-platform acceptance tests. Configure production deep links/redirect URLs and public environment values. Test on physical devices, document deployment and recovery, and prepare store metadata/builds if publishing is in scope.

**Exit:** acceptance checklist passes on production; publishing credentials and final store submission remain human-owned.

## Human-in-the-loop tasks

- Create/confirm the Supabase project, execute the cart migration/schema update, and verify database policies/publication settings.
- In Supabase Auth, enable Google and add the native app redirect URI(s) plus the existing web callback URLs. Google Cloud OAuth redirect configuration remains the Supabase callback URL; do not invent or expose client secrets in the app.
- Supply the production API URL and public Supabase URL/anon key through the agreed local/deployment environment configuration.
- Choose app display name, reverse-DNS iOS bundle identifier, Android application ID, icons/splash assets, supported OS versions, and privacy/support URLs.
- Provide physical iOS/Android devices or simulator/emulator access for OAuth and deep-link tests.
- Decide whether the deliverable ends at working development builds or includes App Store/Google Play submission. Developer accounts, signing, store declarations, and final submission require the human owner.
- Confirm cart merge behavior and approve the lesson demonstration script.

## Acceptance checklist

- [ ] Existing web app continues to pass lint and production build.
- [ ] Mobile app installs and launches on iOS and Android targets.
- [ ] Same Google/Supabase account signs into web and mobile; session survives app restart and sign-out works.
- [ ] Both clients load the same live product catalog from the existing API.
- [ ] Anonymous cart is retained locally; after sign-in it merges according to the documented rule.
- [ ] Signed-in web and mobile carts converge, with Realtime updates visible while both are open.
- [ ] Reopening/reconnecting refetches the persisted cart even if a Realtime event was missed.
- [ ] A user cannot read or overwrite another user's cart.
- [ ] Checkout accepts web cookie auth and mobile bearer auth, rejects unauthenticated requests, and calculates totals from database prices.
- [ ] Orders created on either client appear in the same account's order history.
- [ ] No service-role key, OAuth client secret, or other server secret is bundled or committed.
- [ ] Mailgun is not configured or tested as part of the lesson acceptance.

## Suggested demonstration

Sign into one account in a desktop browser and mobile device. Add a product on web and show it arrive on mobile without a manual refresh. Change quantity on mobile and show the web basket update. Put the device offline briefly, reconnect, and confirm both clients recover the persisted state. Place one order and verify it in the shared order history.# Belmont Mobile Shop Delivery Plan

## Goal

Deliver an iOS and Android shop that uses the existing Belmont web backend and Supabase project. Web and mobile users share accounts, catalog, orders, and a persisted cart. A cart change made in either signed-in client should appear in the other while it is active.

## Decisions

- Keep the existing Next.js application and API at the repository root. Add the Expo application in `mobile/` with its own `package.json` and lockfile.
- Keep the deployed Next.js API as the shared API. Mobile uses `GET /api/products`, `GET/PUT /api/cart`, and `POST /api/checkout`.
- Use the same Supabase Auth project and Google provider. Web retains its cookie session; the native app stores its Supabase session using AsyncStorage and sends its access token as a bearer token to protected API routes.
- Persist authenticated carts in Supabase. Retain browser/mobile local storage for anonymous and offline state, but use the server cart as the signed-in source of truth.
- Use Supabase Realtime Postgres Changes to notify clients of cart changes. The clients still make mutations over HTTPS; Realtime is a refresh signal, not the durable data store.
- Fetch the current cart on launch, focus, and reconnect as a recovery path for missed events. A short-lived subscription is active only while the app is in use.
- For the first release, merge the anonymous cart into the user's server cart at sign-in by adding quantities per product, capped at 99. For concurrent edits, the last successful server write wins for each full-cart update; clients refetch after updates and reconnects.
- Do not implement Mailgun/email work for this lesson. Existing email code can remain untouched; it is not a mobile delivery requirement or acceptance criterion.
- Do not put Supabase service-role or Mailgun credentials in the mobile app. Only public Supabase URL/key and the public API base URL are mobile configuration.

## Architecture

```text
Web (Next.js) --------------------\
  cookie auth, web UI               \
                                    +--> Next.js API --> Supabase Auth/Postgres
Mobile (Expo / React Native) ------/          |                 |
  native auth, bearer token                    |                 +--> Realtime event
                                               +--> verified identity
```

The database remains authoritative. The cart API validates payloads and associates them with the verified user. Row-level security restricts direct client reads/subscriptions to that user's rows. Realtime events cause a refetch rather than carrying trusted cart state. Checkout continues to calculate prices and create orders on the server.

## Delivery Phases: 0 to 100

### Phase 0: Scope and access

Confirm the app name/package IDs, supported device targets, API production URL, Supabase project, Google OAuth provider, and whether existing users can sign in on both platforms. Create development accounts/devices as needed. The lesson explicitly exempts Mailgun.

**Exit:** required non-secret project settings and human-owned accounts are available; no secrets are committed.

### Phase 1: Mobile foundation

Create the Expo TypeScript app under `mobile/`, add Expo Router, establish shared design tokens and navigation, configure environment handling, and document local setup. Confirm it launches on at least one iOS or Android simulator/device.

**Exit:** clean install and app launch work; root web app remains independently installable and buildable.

### Phase 2: Shared identity and catalog

Configure a native Supabase client with persistent session storage and Google OAuth deep links. Build signed-in/signed-out states and sign-out. Load the catalog from the existing API and support product browsing/filtering.

**Exit:** the same test account can sign into web and mobile; mobile catalog reflects the web API.

### Phase 3: Authenticated shared-cart API

Add a user-owned cart representation and RLS policies. Add `GET /api/cart` and `PUT /api/cart`. Centralize API identity resolution so protected routes accept either the current web cookie session or a verified Supabase bearer token. Update checkout to accept both forms without changing its server-side price validation.

**Exit:** API tests cover anonymous rejection, malformed cart rejection, user isolation, and cookie/bearer identity paths; database migration is applied to the shared Supabase project.

### Phase 4: Cross-client synchronization

Update the web cart to hydrate and persist the signed-in server cart while retaining anonymous local storage. Add merge-on-sign-in behavior. Subscribe web and mobile to the signed-in user's cart changes through Supabase Realtime and refetch on launch/focus/reconnect.

**Exit:** with the same account open in both clients, add/update/remove in one client appears in the other; after network interruption both recover from the persisted cart.

### Phase 5: Mobile shopping and checkout

Build product browse, cart editing, sign-in prompt, checkout, order confirmation, and order history. Reuse `/api/checkout`; obtain and send the native access token. Never calculate or trust order prices on the client.

**Exit:** a mobile order appears in the same account's web order history, and a web order appears in mobile history.

### Phase 6: Release readiness

Run lint/build/typecheck and cross-platform acceptance tests. Configure production deep links/redirect URLs and public environment values. Test on physical devices, document deployment and recovery, and prepare store metadata/builds if publishing is in scope.

**Exit:** acceptance checklist passes on production; publishing credentials and final store submission remain human-owned.

## Human-in-the-loop tasks

- Create/confirm the Supabase project, execute the cart migration/schema update, and verify database policies/publication settings.
- In Supabase Auth, enable Google and add the native app redirect URI(s) plus the existing web callback URLs. Google Cloud OAuth redirect configuration remains the Supabase callback URL; do not invent or expose client secrets in the app.
- Supply the production API URL and public Supabase URL/anon key through the agreed local/deployment environment configuration.
- Choose app display name, reverse-DNS iOS bundle identifier, Android application ID, icons/splash assets, supported OS versions, and privacy/support URLs.
- Provide physical iOS/Android devices or simulator/emulator access for OAuth and deep-link tests.
- Decide whether the deliverable ends at working development builds or includes App Store/Google Play submission. Developer accounts, signing, store declarations, and final submission require the human owner.
- Confirm cart merge behavior and approve the lesson demonstration script.

## Acceptance checklist

- [ ] Existing web app continues to pass lint and production build.
- [ ] Mobile app installs and launches on iOS and Android targets.
- [ ] Same Google/Supabase account signs into web and mobile; session survives app restart and sign-out works.
- [ ] Both clients load the same live product catalog from the existing API.
- [ ] Anonymous cart is retained locally; after sign-in it merges according to the documented rule.
- [ ] Signed-in web and mobile carts converge, with Realtime updates visible while both are open.
- [ ] Reopening/reconnecting refetches the persisted cart even if a Realtime event was missed.
- [ ] A user cannot read or overwrite another user's cart.
- [ ] Checkout accepts web cookie auth and mobile bearer auth, rejects unauthenticated requests, and calculates totals from database prices.
- [ ] Orders created on either client appear in the same account's order history.
- [ ] No service-role key, OAuth client secret, or other server secret is bundled or committed.
- [ ] Mailgun is not configured or tested as part of the lesson acceptance.

## Suggested demonstration

Sign into one account in a desktop browser and mobile device. Add a product on web and show it arrive on mobile without a manual refresh. Change quantity on mobile and show the web basket update. Put the device offline briefly, reconnect, and confirm both clients recover the persisted state. Place one order and verify it in the shared order history.
