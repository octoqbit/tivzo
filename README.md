# Tivzo

A premium event workspace with a custom Tivzo mark, light/dark themes, registration pages, QR ticket previews, guest reports and a continuous scanner.

All project files live in the existing **Event Management system** folder selected by the user. The folder currently has a trailing space in its name; quote its path in terminal commands.

## Run in Antigravity

Open this folder in Antigravity. In its terminal:

```sh
npm install --cache .sites-runtime/npm-cache
npm run dev
```

Open the local URL printed in the terminal (normally http://127.0.0.1:5173). Node 22.13 or newer is required. This project uses React/TypeScript with Vinext (Next.js-compatible routing) and a Cloudflare-compatible Sites build. It is editable locally; Antigravity is simply the editor.

## What works now

- Privacy, Terms and Cookie Policy routes, plus an essential-storage notice that remembers dismissal and can be reopened.

- Shared frosted glass surfaces with orange-tinted selection states in both themes; reduced-transparency and print fallbacks. The portal has a separate clear-glass treatment with translucent cards, frosted navigation and a subtle background grid.

- Website home page at `/`, with a **Start project** button opening `/workspace`.
- Original voxel-themed commercial home page with pixel headings, About, FAQs, contact links and Syne workspace headings.

- Organizer dashboard, search, event filters, create draft, publish/close controls, event details and registration preview.
- Guest search/filter, pagination and CSV report download.
- Custom logo/favicon, responsive layouts, light/dark themes and keyboard-accessible native dialogs.
- Public event route at `/events/[slug]`, form validation, QR generation/download and print-to-PDF.
- Camera scanning with automatic QR detection, one pending request per phone, duplicate-frame suppression, committed-result display, safe retries, optional sound/vibration, and automatic readiness for the next ticket.
- Supabase client integration, organizer/staff sign-in, workspace creation and event-scoped volunteer assignment when configured.
- Supabase migration with RLS, capacity enforcement, server-only registration, unguessable hashed ticket secrets, atomic check-in and request receipts.

## Preview mode versus live use

Without Supabase configuration the app is explicitly a **sample workspace**. Demo events created or changed in the UI last only until refresh. The demo ticket form does not save participants. Sample QR tickets cannot admit anyone. The camera can open in demo mode, but it cannot save attendance or approve live entry. Theme choice is device-local and remembered.

Live data is stored in Supabase, never in browser storage as the source of truth. Auth sessions are managed by Supabase Auth. Once connected, the app requires staff sign-in and uses server-side database authorization for all protected operations.

## Connect the live backend

See `docs/SETUP.md`. Copy `.env.example` to `.env.local`, apply `supabase/migrations/202610090001_tivzo.sql` to a **new test Supabase project**, and enter its settings. Do not commit secrets. The sample `.env.local` currently contains blank values.

Real registration remains closed until the server-side Supabase credentials and Cloudflare Turnstile settings are present. The public API never sends the service-role key to the browser. Camera access on a phone requires HTTPS; localhost is allowed for desktop development.

## Verification

```sh
npm run typecheck
npm test
npm run build
```

Database tests run in embedded PostgreSQL with synthetic identities. They check schema execution, RLS isolation, capacity, retry integrity, unauthorized scans, duplicate prevention, recovery receipts, closed events and anonymous access. They are **not a five-phone concurrency benchmark** and do not certify the hosted Supabase setup.

Browser visual/interaction QA could not be run in the authoring session because no browser was available. Review light/dark mode, mobile layouts, camera permission states and the public registration flow in your own browser.

## Before real events

- Configure Supabase Auth email delivery, redirects and staff accounts.
- Confirm Turnstile hostnames and the private/public audience of your hosting. The private Site preview is for the owner; it is not a public participant launch.
- Test two and five actual phones together, including the same QR at exactly the same time and a dropped response after commit.
- Load-test registration bursts while scanning. The initial admission settings are provisional, not guaranteed free-tier capacity.
- Test recovery, venue Wi-Fi/mobile connectivity and a restore from backup.
- Complete Google Drive archive storage, integrity verification and restore testing. Automatic Drive upload and deletion are **not implemented**. The app deliberately provides reports only and has no destructive archive/delete action.
- Email ticket delivery is not implemented; current tickets are displayed immediately and can be saved or printed.

## Folder map

- `app/`: workspace page, public registration route, API configuration and guarded registration endpoint.
- `components/tivzo/`: brand, dashboard, forms, ticket page, scanner, guest/team/settings/archive views.
- `lib/tivzo/`: typed models, preview fixtures, Supabase data operations and ticket helpers.
- `supabase/migrations/`: production-intended PostgreSQL schema and permission rules (requires hosted validation).
- `tests/`: database invariant tests with synthetic data.
- `docs/`: setup, launch checks, original discussion and evolving project plan.
- `public/favicon.svg`: custom vector brand mark.
- `.openai/hosting.json`: Site identity and bindings; no credentials.

The database design supports multiple clubs through separate organizer-owned workspaces and event-scoped volunteers. Initial operating target: two phones normally, with five simultaneous phones supported after validation. Google Drive archives manage historical storage; they do not increase live database throughput.

## Your Cloudflare account

Direct Workers deployment is prepared. See [Cloudflare setup](docs/CLOUDFLARE.md). Start with `npm run cf:login`, then `npm run cf:check`. `npm run cf:deploy` builds and publishes a public workers.dev app in your account; it requires authentication first. Supabase and Turnstile still need runtime configuration.
