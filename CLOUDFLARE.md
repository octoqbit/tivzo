# Deploy Tivzo to your Cloudflare account

This is a direct Cloudflare Workers deployment with a free `workers.dev` address. The existing Sites preview and `.openai/hosting.json` are preserved. The production app uses Supabase authentication, not ChatGPT/Sites sign-in. No real database is connected yet.

## 1. Sign in locally

Open the existing **Event Management system** folder in Antigravity and run this in its terminal:

```sh
npm run cf:login
```

Complete the Cloudflare sign-in and authorization in your browser. Never paste a password or token into chat. Check the selected account:

```sh
npm run cf:whoami
```

If the account contains an unrelated Worker named `tivzo`, do not deploy over it. Pick a distinct name in `wrangler.cloudflare.jsonc` and update the matching name check in `scripts/cloudflare.mjs` first. If multiple accounts are listed, select the intended account through Wrangler; do not guess an account ID.

## 2. Check without publishing

```sh
npm run typecheck
npm run cf:check
```

`cf:check` builds the application and runs Wrangler's local deployment dry run. It does not upload or create a Worker. This is not a traffic or uptime test.

## 3. Publish the sample app

```sh
npm run cf:deploy
```

This rebuilds and publishes the app to the configured Worker in your Cloudflare account. Wrangler prints its actual address, normally `https://tivzo.<your-account-subdomain>.workers.dev`. Availability depends on the account setup. The address is public unless Cloudflare Access is configured. Until the backend is configured, the app displays clearly labeled sample data and rejects real registrations.

Do not upload only `dist/client`: Tivzo needs its Worker for server routes. The deploy command uses `dist/server/wrangler.json`, which points to the built Worker and static assets.

## 4. Connect the real database and registration protection

Follow `docs/SETUP.md` to create the Supabase project, run the migration, and configure authentication email delivery. Create a Turnstile widget that allows the actual deployed hostname.

In Cloudflare, open Workers & Pages → your Tivzo Worker → Settings → Variables and Secrets. Add these **runtime** values:

| Name                        | Value                                             | Secret? |
| --------------------------- | ------------------------------------------------- | ------- |
| `SUPABASE_URL`              | Your Supabase project URL                         | No      |
| `SUPABASE_ANON_KEY`         | Publishable key, or existing anon key             | No      |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret key, or existing service-role key | Yes     |
| `TURNSTILE_SITE_KEY`        | Turnstile widget site key                         | No      |
| `TURNSTILE_SECRET_KEY`      | Turnstile widget secret key                       | Yes     |

Save/deploy the changed settings. No database password is needed in this app. Do not copy `.env.local` into the repository or static assets; local values are not automatically uploaded to Cloudflare. `keep_vars` preserves dashboard-managed variables on later deployments. Secret keys stay server-side. The API configuration endpoint intentionally returns only the public URL, publishable key and Turnstile site key.

Set the Supabase Auth Site URL to your actual Worker URL followed by `/workspace`. Configure its redirects and keep email confirmation enabled. Open `/workspace`, create an organizer account, then create a workspace from Settings.

## 5. Verify before real guests

Test independent organizer accounts, volunteer assignment, registrations, QR scans, same-ticket races, dropped connections and realistic load. Measure CPU/request limits and Supabase usage. Cloudflare's free plan and `workers.dev` address do not guarantee event-day reliability. The current policy pages are preview drafts; update operator details and hosting disclosures before commercial launch.

## Commands and files

- `npm run cf:login`: browser login to Cloudflare.
- `npm run cf:whoami`: inspect the authenticated account.
- `npm run cf:build`: direct Cloudflare build only.
- `npm run cf:check`: rebuild and dry-run deployment.
- `npm run cf:deploy`: rebuild and publish.
- `wrangler.cloudflare.jsonc`: Worker name and runtime settings; no secrets.
- `build/cloudflare-worker.ts`: direct runtime entry point.
- `scripts/cloudflare.mjs`: deployment command wrapper.

Both hosting modes share the ignored `dist` build directory. Each deployment workflow builds its own artifact first. The regular `npm run build` remains the Sites build; the `cf:*` commands select the standalone Cloudflare build.

References: [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/get-started/), [workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/), [runtime variables](https://developers.cloudflare.com/workers/runtime-apis/nodejs/process/).
