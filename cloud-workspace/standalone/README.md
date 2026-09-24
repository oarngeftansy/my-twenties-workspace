# Independent workspace deployment

This deployment replaces the owner-only Sites URL with a Cloudflare Workers URL. The GitHub Pages entry should be changed only after the independent Worker is live and its records, chat and Kimi call have been verified. Do not publish the Kimi key or the workspace password in this repository.

The app uses the existing Vinext build (`npm run build`) and D1 schema. `standalone/worker.mjs` adds a password gate around the entire app, including API routes and static assets. A signed, HttpOnly, Secure cookie lasts 30 days. `standalone/auth.mjs` contains the password and session checks.

1. Sign in with `npx wrangler login` and create a D1 database named `my-twenties-workspace`.
2. Copy `wrangler.standalone.template.jsonc` to the ignored `wrangler.standalone.jsonc` and replace the D1 ID. Keep the binding name `DB`.
3. Run `npm run build`, then apply `drizzle/0000_wide_wendell_rand.sql` and `drizzle/0001_lying_wildside.sql` to the new remote D1 database, in order.
4. Configure `KIMI_API_KEY`, `WORKSPACE_PASSWORD_HASH` (SHA-256 hex of a strong random password) and `SESSION_SECRET` (independent random value) with `wrangler secret put` using the standalone config. Never put their values in `wrangler.standalone.jsonc`.
5. Deploy with `npx wrangler deploy --config wrangler.standalone.jsonc`. Verify that an unauthenticated request cannot read `/api/records`, login succeeds, records save across two sessions, and a real Kimi reply completes.
6. Recheck the old Sites D1 tables (`workspaces` and `ai_jobs`) immediately before switching. Migrate any rows added since the initial empty snapshot. Then update the GitHub Pages entry URL and publish it.

The local smoke test is `node work/verify-standalone.mjs` while the Worker is running on port 3013 with test-only `.dev.vars` values. `node --test standalone/auth.test.mjs` verifies password and session rules. The deployment config can be bundled without credentials using `npx wrangler deploy --config wrangler.standalone.jsonc --dry-run`.
