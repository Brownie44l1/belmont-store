# Mobile Shop Epics and Tickets

The delivery sequence is dependency-driven. Each ticket should be implemented, validated, and committed independently where possible. Secrets and external dashboard actions are human-owned. Mailgun is exempt for this lesson and is deliberately excluded.

## Epic MOB-E0: Scope and project access

### MOB-001: Record mobile architecture and delivery plan

- **Status:** Done
- **Depends on:** None
- **Work:** Document shared-backend decisions, phases, human tasks, and acceptance criteria in `MOBILE_PLAN.md`.
- **Acceptance:** Plan explicitly covers shared API/auth/cart, Realtime tradeoffs, Mailgun exemption, human setup, and end-to-end verification.
- **Validation:** Review plan against the existing API and cart implementation.

### MOB-002: Confirm app identity and external setup

- **Status:** Human action required
- **Depends on:** MOB-001
- **Work:** Choose app name and bundle/application identifiers; confirm Supabase/Google project, production API URL, device targets, and release scope.
- **Acceptance:** Values are recorded in local or deployment configuration without committing credentials; Supabase native redirect URIs are approved.
- **Owner:** Human, with implementation guidance as needed.

## Epic MOB-E1: Expo foundation

### MOB-010: Scaffold the Expo TypeScript app

- **Status:** Not started
- **Depends on:** MOB-002 decisions
- **Work:** Create `mobile/` using Expo, TypeScript, and Expo Router; add app scripts, minimal navigation, `.env.example`, and setup notes.
- **Acceptance:** `npm install` and Expo start work from `mobile/`; app opens on a simulator/device; root web install/build remain unaffected.
- **Validation:** Mobile typecheck and launch; root lint/build.

### MOB-011: Add mobile configuration and API client

- **Status:** Not started
- **Depends on:** MOB-010
- **Work:** Add typed API base URL/config validation and a fetch client that supports public requests and optional bearer tokens.
- **Acceptance:** No hard-coded production/local host, no server secrets, and clear network/API errors.
- **Validation:** Unit or focused tests for URL/config and response error handling.

## Epic MOB-E2: Shared auth and catalog

### MOB-020: Configure native Supabase session persistence

- **Status:** Not started
- **Depends on:** MOB-010, MOB-002
- **Work:** Install Supabase JS and AsyncStorage; configure persistent native auth, URL session handling, Google OAuth/deep linking, and sign-out.
- **Acceptance:** Same Supabase user can sign into web and mobile; session survives restart; sign-out clears local session.
- **Human step:** Enable native redirect URI in Supabase and test Google provider credentials.

### MOB-021: Implement the mobile catalog

- **Status:** Not started
- **Depends on:** MOB-011
- **Work:** Fetch `GET /api/products`; render loading/error/empty states and product/category browsing.
- **Acceptance:** Product data and prices come from the existing API; mobile does not duplicate seed catalog data.

## Epic MOB-E3: Shared authenticated cart service

### MOB-030: Add durable cart schema and policies

- **Status:** Not started
- **Depends on:** MOB-002
- **Work:** Add migration/schema for user-owned cart items and `updated_at`; add owner-scoped RLS and enable the required Realtime publication.
- **Acceptance:** Authenticated users can read only their own cart; schema is repeatable/documented; no anonymous or cross-user access.
- **Human step:** Apply migration in the configured Supabase project and verify Realtime is enabled.

### MOB-031: Support cookie and bearer identity in API routes

- **Status:** Not started
- **Depends on:** MOB-030
- **Work:** Add a server-only request-user helper. Verify `Authorization: Bearer <access_token>` with Supabase Auth; preserve cookie-session behavior; update checkout to use the helper.
- **Acceptance:** Existing web checkout remains supported; valid mobile access token works; invalid/missing token gets 401; server prices remain authoritative.
- **Validation:** Focused route tests or documented manual HTTP checks plus root lint/build.

### MOB-032: Add authenticated cart API

- **Status:** Not started
- **Depends on:** MOB-030, MOB-031
- **Work:** Implement `GET /api/cart` and `PUT /api/cart` with strict product ID/quantity validation and verified-user scoping.
- **Acceptance:** Reads/replaces only the caller's cart; malformed or excessive payloads return 400; anonymous requests return 401.
- **Validation:** Route tests for auth, validation, isolation, and empty cart behavior.

## Epic MOB-E4: Web/mobile cart synchronization

### MOB-040: Synchronize the web cart with the server

- **Status:** Not started
- **Depends on:** MOB-032
- **Work:** Extend the web CartProvider to hydrate/persist the server cart for signed-in users and retain local anonymous storage.
- **Acceptance:** Existing anonymous shopping still works; sign-in merges local quantities into the user cart capped at 99; checkout uses the latest cart.
- **Validation:** Web interaction checks plus lint/build.

### MOB-041: Add Realtime notifications and recovery fetches

- **Status:** Not started
- **Depends on:** MOB-030, MOB-040
- **Work:** Subscribe to the current user's cart changes in both apps; refetch on launch, focus, and reconnect; unsubscribe on sign-out/unmount.
- **Acceptance:** Mutations appear in the other active client; disconnect/reconnect converges to database state; no cross-user events leak.
- **Validation:** Two-client manual synchronization script in `MOBILE_PLAN.md`.

## Epic MOB-E5: Mobile cart, checkout, and orders

### MOB-050: Implement mobile cart editing

- **Status:** Not started
- **Depends on:** MOB-021, MOB-032, MOB-041
- **Work:** Add quantity editing/removal/clear and shared cart state to the mobile UI.
- **Acceptance:** Signed-in edits persist and sync; anonymous edits remain local pending sign-in; quantity limits match API validation.

### MOB-051: Implement mobile checkout and order history

- **Status:** Not started
- **Depends on:** MOB-020, MOB-031, MOB-050
- **Work:** Send cart items to `POST /api/checkout` with the current bearer token; show confirmation and the shared user's order history.
- **Acceptance:** Checkout rejects unauthenticated users; successful orders appear on web and mobile; client prices are never submitted as authoritative values.
- **Validation:** Test order against configured Supabase project; email is not part of acceptance.

## Epic MOB-E6: Quality and release

### MOB-060: Complete cross-client acceptance and security checks

- **Status:** Not started
- **Depends on:** MOB-041, MOB-051
- **Work:** Run the acceptance checklist in `MOBILE_PLAN.md`, check user isolation, offline recovery, token handling, and web regressions.
- **Acceptance:** Checklist has recorded results for supported platforms and no secrets are bundled.
- **Human step:** Run Google OAuth on real devices and confirm production redirect allowlists.

### MOB-061: Prepare development/release handoff

- **Status:** Not started
- **Depends on:** MOB-060
- **Work:** Document exact install/run/build commands, environment variable names, redirect setup, and known limitations; prepare store build configuration only if publishing is in scope.
- **Acceptance:** Another developer can launch both apps; store credentials/signing remain human-controlled.

## Current execution

1. MOB-001 is documented and complete.
2. MOB-002 needs the human-owned app identity and Supabase/Google access before final configuration, but implementation can proceed using clearly named placeholders.
3. Start with MOB-030 through MOB-032: a server cart plus dual cookie/bearer auth is the enabling backend slice for both web and mobile.# Mobile Shop Epics and Tickets

The delivery sequence is dependency-driven. Each ticket should be implemented, validated, and committed independently where possible. Secrets and external dashboard actions are human-owned. Mailgun is exempt for this lesson and is deliberately excluded.

## Epic MOB-E0: Scope and project access

### MOB-001: Record mobile architecture and delivery plan

- **Status:** Done
- **Depends on:** None
- **Work:** Document shared-backend decisions, phases, human tasks, and acceptance criteria in `MOBILE_PLAN.md`.
- **Acceptance:** Plan explicitly covers shared API/auth/cart, Realtime tradeoffs, Mailgun exemption, human setup, and end-to-end verification.
- **Validation:** Review plan against the existing API and cart implementation.

### MOB-002: Confirm app identity and external setup

- **Status:** Human action required
- **Depends on:** MOB-001
- **Work:** Choose app name and bundle/application identifiers; confirm Supabase/Google project, production API URL, device targets, and release scope.
- **Acceptance:** Values are recorded in local or deployment configuration without committing credentials; Supabase native redirect URIs are approved.
- **Owner:** Human, with implementation guidance as needed.

## Epic MOB-E1: Expo foundation

### MOB-010: Scaffold the Expo TypeScript app

- **Status:** Not started
- **Depends on:** MOB-002 decisions
- **Work:** Create `mobile/` using Expo, TypeScript, and Expo Router; add app scripts, minimal navigation, `.env.example`, and setup notes.
- **Acceptance:** `npm install` and Expo start work from `mobile/`; app opens on a simulator/device; root web install/build remain unaffected.
- **Validation:** Mobile typecheck and launch; root lint/build.

### MOB-011: Add mobile configuration and API client

- **Status:** Not started
- **Depends on:** MOB-010
- **Work:** Add typed API base URL/config validation and a fetch client that supports public requests and optional bearer tokens.
- **Acceptance:** No hard-coded production/local host, no server secrets, and clear network/API errors.
- **Validation:** Unit or focused tests for URL/config and response error handling.

## Epic MOB-E2: Shared auth and catalog

### MOB-020: Configure native Supabase session persistence

- **Status:** Not started
- **Depends on:** MOB-010, MOB-002
- **Work:** Install Supabase JS and AsyncStorage; configure persistent native auth, URL session handling, Google OAuth/deep linking, and sign-out.
- **Acceptance:** Same Supabase user can sign into web and mobile; session survives restart; sign-out clears local session.
- **Human step:** Enable native redirect URI in Supabase and test Google provider credentials.

### MOB-021: Implement the mobile catalog

- **Status:** Not started
- **Depends on:** MOB-011
- **Work:** Fetch `GET /api/products`; render loading/error/empty states and product/category browsing.
- **Acceptance:** Product data and prices come from the existing API; mobile does not duplicate seed catalog data.

## Epic MOB-E3: Shared authenticated cart service

### MOB-030: Add durable cart schema and policies

- **Status:** Not started
- **Depends on:** MOB-002
- **Work:** Add migration/schema for user-owned cart items and `updated_at`; add owner-scoped RLS and enable the required Realtime publication.
- **Acceptance:** Authenticated users can read only their own cart; schema is repeatable/documented; no anonymous or cross-user access.
- **Human step:** Apply migration in the configured Supabase project and verify Realtime is enabled.

### MOB-031: Support cookie and bearer identity in API routes

- **Status:** Not started
- **Depends on:** MOB-030
- **Work:** Add a server-only request-user helper. Verify `Authorization: Bearer <access_token>` with Supabase Auth; preserve cookie-session behavior; update checkout to use the helper.
- **Acceptance:** Existing web checkout remains supported; valid mobile access token works; invalid/missing token gets 401; server prices remain authoritative.
- **Validation:** Focused route tests or documented manual HTTP checks plus root lint/build.

### MOB-032: Add authenticated cart API

- **Status:** Not started
- **Depends on:** MOB-030, MOB-031
- **Work:** Implement `GET /api/cart` and `PUT /api/cart` with strict product ID/quantity validation and verified-user scoping.
- **Acceptance:** Reads/replaces only the caller's cart; malformed or excessive payloads return 400; anonymous requests return 401.
- **Validation:** Route tests for auth, validation, isolation, and empty cart behavior.

## Epic MOB-E4: Web/mobile cart synchronization

### MOB-040: Synchronize the web cart with the server

- **Status:** Not started
- **Depends on:** MOB-032
- **Work:** Extend the web CartProvider to hydrate/persist the server cart for signed-in users and retain local anonymous storage.
- **Acceptance:** Existing anonymous shopping still works; sign-in merges local quantities into the user cart capped at 99; checkout uses the latest cart.
- **Validation:** Web interaction checks plus lint/build.

### MOB-041: Add Realtime notifications and recovery fetches

- **Status:** Not started
- **Depends on:** MOB-030, MOB-040
- **Work:** Subscribe to the current user's cart changes in both apps; refetch on launch, focus, and reconnect; unsubscribe on sign-out/unmount.
- **Acceptance:** Mutations appear in the other active client; disconnect/reconnect converges to database state; no cross-user events leak.
- **Validation:** Two-client manual synchronization script in `MOBILE_PLAN.md`.

## Epic MOB-E5: Mobile cart, checkout, and orders

### MOB-050: Implement mobile cart editing

- **Status:** Not started
- **Depends on:** MOB-021, MOB-032, MOB-041
- **Work:** Add quantity editing/removal/clear and shared cart state to the mobile UI.
- **Acceptance:** Signed-in edits persist and sync; anonymous edits remain local pending sign-in; quantity limits match API validation.

### MOB-051: Implement mobile checkout and order history

- **Status:** Not started
- **Depends on:** MOB-020, MOB-031, MOB-050
- **Work:** Send cart items to `POST /api/checkout` with the current bearer token; show confirmation and the shared user's order history.
- **Acceptance:** Checkout rejects unauthenticated users; successful orders appear on web and mobile; client prices are never submitted as authoritative values.
- **Validation:** Test order against configured Supabase project; email is not part of acceptance.

## Epic MOB-E6: Quality and release

### MOB-060: Complete cross-client acceptance and security checks

- **Status:** Not started
- **Depends on:** MOB-041, MOB-051
- **Work:** Run the acceptance checklist in `MOBILE_PLAN.md`, check user isolation, offline recovery, token handling, and web regressions.
- **Acceptance:** Checklist has recorded results for supported platforms and no secrets are bundled.
- **Human step:** Run Google OAuth on real devices and confirm production redirect allowlists.

### MOB-061: Prepare development/release handoff

- **Status:** Not started
- **Depends on:** MOB-060
- **Work:** Document exact install/run/build commands, environment variable names, redirect setup, and known limitations; prepare store build configuration only if publishing is in scope.
- **Acceptance:** Another developer can launch both apps; store credentials/signing remain human-controlled.

## Current execution

1. MOB-001 is documented and complete.
2. MOB-002 needs the human-owned app identity and Supabase/Google access before final configuration, but implementation can proceed using clearly named placeholders.
3. Start with MOB-030 through MOB-032: a server cart plus dual cookie/bearer auth is the enabling backend slice for both web and mobile.