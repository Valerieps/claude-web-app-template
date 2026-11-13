# ADR-004: Cloudflare Workers static assets, not Pages

**Status:** Accepted
**Date:** 2026-11-13
**Decision:** The built app is served by a Cloudflare Worker with static assets only
(`wrangler.jsonc`: `assets.directory` is `dist`, single-page fallback, no `main`, no server code).
Workers Builds, connected to the GitHub repository, runs `npm run build` and deploys `main` with
`npx wrangler deploy`; other branches upload a preview version with `npx wrangler versions upload`.
The production address is `https://<name>.souza.pereira.valeria.workers.dev`, where `<name>` is the
Worker's `name` and `souza.pereira.valeria` is the owner's account subdomain. `npm run build` ends
with `wrangler deploy --dry-run`, so CI catches a config that would not deploy. Headers stay in
`public/_headers`, which Workers static assets read the same way Pages did.
**Why:** The owner deploys every app on Workers, not Pages, and the group-app template
(claude-web-app-cloudflare-template) already does. One platform means one console, one CLI and one
address pattern. Static assets on Workers are free and are not counted as Worker requests.
**Alternatives:** Cloudflare Pages (the earlier default; Cloudflare now points new projects to
Workers); any other static host (a second vendor for no gain).
**Limits to watch:** An app that later needs a server adds `main` and its code to the same Worker,
with a new ADR; the group-app template shows how.
