# Event platform — project brief and implementation plan

Prepared 8 October 2026. Status: initial Tivzo implementation created 9 October 2026. See SETUP.md and README.md for tested scope and remaining live-service integrations.

## Continuity

This project continues “QR ticket entry system” (conversation ID `6ac7d5e6-96ec-83ec-8289-90fc6c759dc9`). The recovered discussion is saved alongside this file as `recovered-discussion.md`. The reader returned five turns and no further page or attachments. Historical suggestions are distinguished below from requirements in the current request.

This chat has been renamed for the project. These files are saved in its local workspace; a named project container has not been created in the app. Project creation is not exposed by the available app tools, and computer control of Codex is blocked. The earlier assistant's statement that it transferred the discussion is not evidence of a completed transfer.

## Agreed requirements

- Serve 10–20 independent clubs and approximately 10,000 participants initially.
- Use a free-first Supabase/PostgreSQL architecture.
- Provide organizer and volunteer accounts with distinct permissions.
- Make participant registration frictionless.
- Issue unique, secure QR tickets.
- Enforce one successful check-in per ticket atomically, including simultaneous scans.
- Provide a real-time attendance dashboard.
- Prioritize reliability during concurrent registration and entry traffic.
- Support five scanning phones simultaneously per event; normal event operation uses two phones. All supported phones use continuous camera operation and fast readiness for the next participant after server confirmation.
- No per-ticket button presses: after initial sign-in, event selection and camera permission/start, QR detection, submission, attendance saving, result display and readiness for the next ticket are automatic.
- Archive completed event data to Google Drive, verify the archive, then remove that event's detailed records from Supabase. This is an agreed design direction, not authorization to delete existing live data now.

Working defaults, open to revision: participants register without creating accounts; launch with free events; pilot with the user's own club. Five simultaneous scanner phones per event is the agreed capacity requirement, with two normally in use. Additional authorized phones can join the same event without changing the application or interrupting existing scanners. Different clubs may run events simultaneously, so total platform scanner capacity also needs testing. “10,000 participants” is a platform size target, not an assumption that all are concurrent or that each registers only once. Branding, hosting, maximum arrivals per 30 minutes, peak registration submissions, archive delay, and ticket-delivery provider remain undecided.

## First release

| Person | Experience |
|---|---|
| Participant | Open event link → provide minimal details → receive and download QR ticket |
| Organizer | Sign in → create and publish event → assign volunteers → monitor attendance → export a report |
| Volunteer | Sign in → select assigned event → scan continuously → see a clear confirmed, used, invalid, or pending result |
| Platform owner | Approve/manage clubs and staff access, with logged administrative actions |

Include event capacity, registration closing time, event cancellation, and ticket revocation. Provide downloadable/printable tickets immediately; queue email delivery independently so an email outage cannot lose a registration. Basic branding and CSV export belong in the pilot. PDF polish and email delivery were earlier proposals and should be completed after the core entry flow is proven. Payments, WhatsApp, subscriptions, certificates, and event discovery are later features.

## Architecture

Use a mobile-friendly web application with cached public event pages, a registration API, a small authenticated check-in API, and an organizer dashboard. Next.js/TypeScript was the earlier frontend proposal; final framework and hosting selection are implementation decisions. Supabase supplies PostgreSQL and staff authentication. Use real-time subscriptions only for authorized staff dashboards, with periodic reconciliation and a visible stale-data indicator.

Registration and check-in need separate request limits and concurrency budgets. This reduces contention at the application layer, but both still share database capacity and must be tested together. Generate QR images on demand rather than storing one image per participant. Keep PDF creation, email delivery, and report generation outside the check-in transaction. Use bounded database connections or the supported API path; do not open one database connection per visitor.

Supabase supports row-level security with Auth for tenant isolation. Apply it to all exposed tables and verify both reads and writes. Never expose a service-role key to the browser. Function privileges require separate attention: restrict execution and explicitly validate the actor and event if a privileged function is necessary. Sources: [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security), [database functions](https://supabase.com/docs/guides/database/functions).

## Proposed data model

| Record | Purpose and constraints |
|---|---|
| Staff identity/profile | Supabase Auth identity; optional display profile; no participant account required |
| Organizations | Club identity and status |
| Organization memberships | Unique organization/user pair with an organizer role; no self-assigned elevation |
| Events | Organization, public slug, dates, status, capacity and registration window |
| Event staff | Unique event/user assignment with scanner permission |
| Registrations | Event, minimal participant details, ticket token hash, issue/revocation state |
| Check-ins | Unique registration ID, server timestamp, verifying staff member and request ID |
| Request receipts | Actor/scope/request key, payload fingerprint and stable outcome for retries |
| Delivery outbox | Optional queued ticket delivery and retry status |

Use foreign keys and constraints to prevent cross-event or cross-club associations. Index token hashes, event-scoped lists, memberships and staff assignments. Additional membership and assignment tables refine the earlier five-table sketch to support multiple organizers safely. Keep check-ins as the authoritative attendance record; avoid an independently editable attendance flag.

## Registration correctness

The public API validates the event, input length, registration window and capacity on the server. A single transaction enforces capacity and creates the registration. Repeated submissions with the same unpredictable request key and identical payload return the same ticket result; reuse with a different payload is rejected. Store an appropriately protected receipt so the original response can be recovered after a timeout without storing raw tokens in ordinary logs.

Generate a cryptographically random ticket secret (proposed: 32 random bytes), place it in the QR payload without personal information, and store its hash for indexed lookup. A public-facing short reference must not function as the entry credential. Ticket retrieval requires a high-entropy capability or a verified delivery channel; knowing someone's email must not expose their ticket. A copied QR remains a bearer ticket: atomic check-in prevents two successful admissions, but does not establish the holder's identity.

Rate-limit abusive registration attempts. Participant duplicate policy is still a product decision: retry deduplication is mandatory, whereas one registration per email could exclude legitimate shared-email registrations and does not verify identity.

## Atomic check-in and safe retries

1. Authenticate the volunteer and verify a current assignment to the selected event.
2. Bind an unpredictable scan request ID to that actor, event and token fingerprint.
3. In one database transaction, look up and lock the registration, validate event/status/revocation and attempt to insert the check-in.
4. Enforce a unique constraint on the registration ID. Only the transaction that creates the check-in can create a new approval. Independent later scans return “Already checked in” with the original server time.
5. Save the request outcome in the same transaction and return only after commit. A retry of the same request recovers that receipt without creating another check-in. Mark recovered results clearly so the volunteer does not interpret a retry as a second admission.

The unique constraint is the final duplicate guard; client-side debounce only improves scanning usability. PostgreSQL provides conflict handling for unique constraints, but the whole authorization, validation and receipt flow still requires implementation and concurrency tests. See [PostgreSQL INSERT and ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html).

Ticket revocation and check-in must share a locking/order rule so their race has a deterministic outcome. Revoke scanner access immediately on the server. Use server time, not the phone clock. Volunteers receive only the fields needed for entry and cannot browse club-wide participant data.

On timeout, show “Confirmation pending” and retry the same request. Never display approval before a confirmed committed result. Keep the camera active with duplicate-frame suppression and an explicit ready-for-next-person state. Offline admission is excluded from the first release because disconnected scanners cannot enforce global one-entry-only rules. A connectivity failure must not produce false approval.

## Reliability acceptance plan

### Five-phone capacity, two-phone normal operation

Keep each camera open throughout entry. Decode the QR locally and send only the ticket token, selected event and request ID to the authenticated check-in endpoint. Display a pending state while the transaction runs. On confirmation, show a large result with participant identity fields sufficient to match the result to that person; use distinct sound/vibration where the browser permits it. Automatically return to scanning after a brief readable result interval. Suppress repeated camera frames of the same QR and allow only one unresolved check-in per phone so results cannot be attributed to the wrong person. An invalid/used result should be clearly distinguishable from a new approval.

Normal scanning requires no Scan, Submit, Save, Confirm or Next button presses per ticket. Initial event selection and browser camera permission/start may require interaction. Automatically detect and submit a QR, wait for the committed server result, show the result, and re-arm for a different QR. Do not resubmit a QR held continuously in frame; allow it to be scanned again once removed and presented again, in which case the server returns its current status. Invalid/used results also return automatically to readiness after a readable result interval. Network-uncertain requests retain their request ID and pending state; never show green or advance to an unrelated ticket while that request is unresolved. Provide pause/manual recovery controls for exceptions without making them part of the normal ticket flow.

Target decode-to-confirmation p95 below one second under the defined mixed-load test, measured on the actual phones and venue connection. Camera aiming and participant movement add time: at an assumed complete cycle of 3–5 seconds per person, two phones have a theoretical throughput of 24–40 people per minute (720–1,200 in 30 minutes). This arithmetic assumes continuous use and excludes delays and exception handling; measure the real queue capacity during rehearsal. Provide an exception/help position so unresolved tickets do not block both lines, and a tested backup internet connection.

### Registration traffic controls

- Cache public event descriptions and static assets; validate live event status and capacity on submission.
- Keep the save transaction short, with uniqueness/capacity checks and safe retry receipts. Generate the visible QR from the committed ticket result; defer email and expensive exports.
- Reuse a bounded set of database connections through the appropriate supported pool/API path. Pooling reduces connection overhead but does not increase database compute capacity. See [Supabase pooling and limits](https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits).
- Apply per-event and global admission limits to registration independently of check-in. Use abuse limits that account for many genuine participants sharing campus Wi-Fi; a strict IP-only cap could block them all.
- If the measured safe registration rate is exceeded, use a bounded admission/waiting mechanism with a visible wait state. A waiting visitor does not have a ticket or reserved place until the database commits. Retry with backoff and jitter, retaining the same request key after uncertain responses.
- Keep dashboards and background exports within separate budgets. Both entry and registration still share database resources; route separation alone cannot guarantee priority.
- Test ramped and sudden bursts at 100, 500 and 1,000 concurrent registration clients while two phones scan, then while all five phones scan. Specify the request arrival rate and test duration as well as client count. Use the results to set supported event capacity and determine whether the free tier is sufficient.

These are proposed launch gates, not measured performance or promises. Record test environment, database tier, region, dataset, request rate, device count and network conditions with every result.

| Test | Proposed acceptance |
|---|---|
| Tenant isolation | No cross-club reads, exports, updates or scans; direct API attempts fail too |
| Duplicate race | All five phones submit the same ticket simultaneously; exactly one check-in row and one new approval. Verify normal two-phone operation too. Repeat with 20 simulated clients as a stress test |
| Lost response | Drop the response after commit; retry returns the original receipt, with no second check-in |
| Invalid/revoked/wrong-event ticket | No approval; unauthorized staff also fail |
| Capacity race | Concurrent requests cannot overbook; the last available place is allocated once |
| Registration burst | Ramp through 100, 500 and 1,000 concurrent clients; measure completion and failures; no lost acknowledged registrations or duplicate retry-created tickets |
| Mixed load | Run registration traffic with two, then five scanners, each submitting one request every two seconds, including synchronized bursts from all five phones; target decode-to-confirmation p95 below one second for each phone for 30 minutes on a stable test network. Test 10–20 simulated scanners separately for concurrent events and headroom |
| Add scanners during entry | Start with two phones, then join three more authorized phones to the same event; existing scanners continue uninterrupted and all five share duplicate prevention and attendance totals |
| Hands-free ticket flow | After initial scanner setup, scan a sequence of different tickets without screen taps; each is saved once, displays its confirmed result and automatically permits the next scan. Holding one QR in frame creates no repeated submissions |
| Overload/network loss | Bounded waits and retries; explicit pending/retry states; zero false approvals |
| Dashboard recovery | Reconnect and reconcile to database totals; proposed freshness target within five seconds under normal conditions |

Seed at least 20 clubs, 100 events and 10,000 registrations for representative testing. Also measure database size including indexes, p99 latency, errors, lock waits, connections and quota consumption. Concurrent users and requests per second are different measures; the scanner tests above propose one total request per second with two phones and 2.5 with five phones, plus synchronized bursts. The 10–20 simulated scanners at the same cadence produce 5–10 total requests per second. Run load tests against a dedicated test environment and reconcile all accepted requests afterward.

Before each pilot, verify provider/project availability, venue connectivity, staff access and backup/export recovery. Monitor latency and error rate during entry. Upgrade or reduce the advertised capacity when measured tests fail; no architecture can promise zero crashes under unlimited traffic.

## Cost boundary

Completed-event archiving: close registration and entry, produce a private restorable export including event details, registrations, check-ins and relevant receipts, verify record counts/checksums and restoration, then delete only that event's eligible details. Preserve club and staff accounts and optionally a minimal event summary/archive reference. A seven-day correction window was suggested but is not yet agreed. If archiving fails, delete nothing. Ticket secrets and participant data require protected archives and appropriately restricted access. Batch archival/deletion outside busy entry periods. This frees reusable database space; it does not guarantee immediate shrinkage of allocated disk, eliminate bandwidth/compute limits or solve backup requirements for currently active events.

Supabase's published Free plan currently lists a 500 MB database, shared CPU and 500 MB RAM, 5 GB egress, and pausing after one week of inactivity. Realtime includes 200 peak connections and two million monthly messages. These are distinct limits; 10,000 participant records does not imply 10,000 simultaneous Realtime connections. Checked 8 October 2026: [Supabase pricing](https://supabase.com/pricing).

Free-first is a development and pilot budget goal, not a capacity or availability guarantee. Measure storage instead of relying on the earlier rough kilobyte-per-registration estimate. Before deployment, verify hosting terms, email quotas, backup/recovery options and database performance. No paid subscription or infrastructure has been created.

## Delivery order

1. **Database and access foundation:** migrations, club memberships, event assignments, access policies and representative fixtures. Exit: isolation tests pass.
2. **One complete event flow:** organizer creates event; participant registers and downloads a ticket; volunteer checks in. Exit: capacity, concurrent duplicate and retry tests pass.
3. **Operational tools:** continuously running camera, live dashboard with recovery, revocation, exports and queued delivery. Exit: mobile and failure-path checks pass.
4. **Pilot readiness:** mixed-load tests, measured capacity, provider-limit review and venue rehearsal. Exit: recorded results meet agreed launch gates.

The first implementation task is the database schema plus atomic registration/check-in functions and their meaningful concurrency tests. Peak arrivals per 30 minutes is the most useful remaining sizing input, but it does not block that foundation work.
