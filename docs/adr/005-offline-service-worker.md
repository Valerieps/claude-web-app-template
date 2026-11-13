# ADR-005: A generated service worker keeps the app usable offline

**Status:** Accepted
**Date:** 2026-11-13
**Decision:** After each production build, `vite.config.ts` writes `dist/sw.js` from
`service-worker-source.ts`: a list of every built file and a version hashed from their contents.
`src/infrastructure/register-service-worker.ts` registers it in production builds only. The worker
caches the files on install, answers GET requests to its own origin from the cache first (every
navigation gets the cached `index.html`, kept as `./`), falls back to the network for anything it
does not have, and deletes older caches when it activates. It never calls `skipWaiting`: a new
version takes over once every tab of the app is closed, so the person gets it on the second opening.
Tested in `src/service-worker.test.ts` with a fake worker scope.
**Why:** An installed app that does not open without internet is not an app. Writing the worker
ourselves keeps it about forty lines, with no dependency (Workbox or vite-plugin-pwa would add
many, against ADR-001), and it stays inside the CSP: the worker only fetches the app's own files,
and the CSP is a meta tag, so it does not apply to the worker (ADR-002).
**Alternatives:** vite-plugin-pwa (Workbox, dozens of transitive dependencies); network-first
caching (slow on a weak connection, and still needs the cache); `skipWaiting` on every deploy
(could swap files under an open page and break lazy-loaded chunks).
**Limits to watch:** The browser checks for a new `sw.js` on navigation, so a fix reaches people
on their second opening, not the first. An app with server data needs its own rule for API
responses (the worker ignores other origins; a same-origin `/api` would need a new ADR).
