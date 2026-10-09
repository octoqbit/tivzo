# Tivzo setup and launch checks

## Supabase

1. Create a Supabase project in a region near the event audience. Start with a test project.
2. Run `supabase/migrations/202610090001_tivzo.sql` once using the Supabase SQL editor or migration workflow. Do not rerun against an existing schema without reviewing it.
3. Copy the project URL, anon/publishable browser key and service-role key into the corresponding `.env.local` variables. The service-role credential is server-only. Never paste it into browser code, a URL, a screenshot or a repository.
4. Configure Supabase Auth's allowed site/redirect URLs and production email provider. Create/confirm the organizer account through Tivzo. On first sign-in, open Settings and create a workspace.
5. Create and publish a test event. Volunteers create their own accounts; the organizer assigns existing account emails under Team. Assignment itself does not send messages.
6. Check the `registrations` and `check_ins` publication settings. The migration adds them to `supabase_realtime` if it exists. Organizer dashboards also reconcile every 15 seconds. Confirm Realtime honors RLS in the target project; no ticket hashes may be exposed to browsers.
7. Restart the development server after changing `.env.local`. Hosted environment values must be configured separately through the hosting service's secret manager; local files are not uploaded.

## Public registration protection

Create a Cloudflare Turnstile widget with the actual production hostname. Set `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. The server validates the token and hostname. Missing protection closes registration rather than accepting unprotected traffic.

The client generates a 256-bit ticket secret and a UUID request key. The server stores only the ticket hash. A client retry using the same key, name, email and secret recovers the original receipt, even after an event closes. Keep the form open when retrying: refresh loses the temporary client-held ticket secret. Ticket recovery by verified email is a future feature.

The initial SQL admission settings accept at most 120 calls per 10-second window globally and 80 per 10 seconds per event. These are provisional ceilings, not proven capacity or a durable waiting queue. Excess traffic receives HTTP 429 and a Retry-After value. A busy response never means a ticket is reserved. Global/event counters avoid unfairly blocking a whole campus behind one shared IP. Configure hosting-level bot/abuse limits too: an application admission gate cannot stop all network traffic from reaching the hosting layer.

Registration and scanner functions share a PostgreSQL database. They have separate application paths, but resource isolation and scan-latency guarantees require mixed-load measurement. Keep email, reports and eventual archiving outside entry transactions and busy periods.

## Check-in behavior

Each phone selects the event and starts the camera once. QR detection, verification, saved result and readiness for the next QR are automatic. There is one unresolved ticket per phone, so a result cannot be attached to a different person. The same QR held in frame does not submit repeatedly.

Only authorized staff can execute check-in. The transaction records a unique registration check-in and an actor-bound request receipt. A simultaneous second scan gets `used`; a transport retry of the same scan gets the original result with `replayed=true`. The UI labels a recovered receipt instead of treating it as a fresh admission.

If confirmation cannot be recovered after bounded retries, keep the guest at the scanner and use Retry confirmation when connected. Do not approve an offline entry. Give exceptions a separate help position so they do not block every line.

## Required real-world validation

- Independent clubs cannot read, change, export or scan one another's data.
- Volunteers can scan assigned events but cannot browse participant lists or issue tickets.
- Two and five phones scan different tickets, then the same ticket simultaneously. Exactly one new approval and one database row for a shared ticket.
- Drop a response after database commit. Retrying preserves the original time and staff identity and creates no second check-in.
- Run 100, 500 and 1,000-client registration bursts while all five phones scan, using synthetic data in a dedicated test environment. Record arrival rate, p95/p99 latency, errors, connections, locks and exact database reconciliation.
- Aim for decode-to-confirmation p95 under one second per phone under defined stable network conditions. Do not advertise this until measured.
- Confirm actual phone camera support, sound/vibration, screen lock behavior, permissions, mobile data and venue Wi-Fi.
- At 200% browser zoom, check that controls remain reachable, labels readable and no essential content clipped.

## Deferred integrations

Google Drive archiving needs OAuth/storage access, a full restorable archive format, integrity manifests, a verified restore and a retention policy. The JSON/CSV UI exports are reporting exports only. Do not delete records on the basis of these reports. Deletion remains intentionally absent.

Email delivery, password recovery UI, ticket recovery, multiple organizer memberships per club, paid tickets and offline admission are not part of this initial build. Password recovery can be handled through Supabase while its UI is added. Project planning documents describe future scope; this setup guide describes what the current implementation actually does.

## Verification performed in this build

TypeScript checking and embedded PostgreSQL invariant/permission tests are automated. Build and route status checks are run before delivery. Real Supabase concurrency tests, hardware camera tests and browser visual QA need the connected environment and are not represented as completed.

## Commercial website and policies

The home page now has a voxel design, About, feature explanations, FAQs and user-specified email links. `help@tivzo.in` and `info@tivzo.in` are displayed as mailto links only; mailbox provisioning and deliverability were not configured or verified.

Privacy, Terms and Cookie Policy pages are explicitly preview drafts. Confirm operator legal identity, jurisdiction, lawful processing grounds, deployment-provider cookie inventory, international transfers and retention periods before a public launch. No compliance certification is implied.

The cookie banner stores essential-only acknowledgement for a 180-day notice interval and can be reopened from the footer. There are no optional application trackers. Theme preference storage is written only on explicit selection; Supabase session storage is used only with live authentication. The banner does not control Sites' own authentication cookies.

Policy drafting reference: [ICO privacy notices and cookies guidance](https://ico.org.uk/for-organisations/advice-for-small-organisations/privacy-notices-and-cookies/cookies-and-privacy-notices-in-detail/). It informs clear disclosures, not a jurisdiction-specific legal determination.
