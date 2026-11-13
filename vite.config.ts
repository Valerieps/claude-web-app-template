import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import type { Plugin } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { ALLOWED_ORIGINS, LOCAL_ONLY } from './network-policy.ts';
import { SERVICE_WORKER_FILE, serviceWorkerSource } from './service-worker-source.ts';

// Strict CSP (docs/SEGURANCA.md, ADR-002). Injected only in production builds: the dev server
// needs a websocket for hot reload, which a closed `connect-src` would block. It is a meta tag
// rather than a header so it never applies to a service worker, if the app gets one.
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  LOCAL_ONLY ? "connect-src 'none'" : `connect-src ${ALLOWED_ORIGINS.join(' ')}`,
  "img-src 'self' data:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler: () => [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
          injectTo: 'head-prepend',
        },
      ],
    },
  };
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

// Writes dist/sw.js once the build and the copy of public/ are on disk (ADR-005). The version is a
// hash of every built file, so any change to the app gives a new worker and a new cache.
function offlineServiceWorker(): Plugin {
  let outDir = '';
  return {
    name: 'offline-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    writeBundle() {
      const files = filesUnder(outDir)
        .map((path) => relative(outDir, path).split(sep).join('/'))
        .filter((file) => file !== SERVICE_WORKER_FILE)
        .sort();
      const hash = createHash('sha256');
      for (const file of files) hash.update(file).update(readFileSync(join(outDir, file)));
      writeFileSync(join(outDir, SERVICE_WORKER_FILE), serviceWorkerSource(hash.digest('hex').slice(0, 12), files));
    },
  };
}

// Lets tooling assign a port through the PORT environment variable.
const port = process.env.PORT ? Number(process.env.PORT) : undefined;

export default defineConfig({
  server: { port },
  preview: { port },
  // Relative base so the build works from any path (the Worker, a subfolder, preview).
  base: './',
  plugins: [react(), contentSecurityPolicy(), offlineServiceWorker()],
  build: {
    // Keep everything as files under 'self'; never inline assets as scripts.
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'node',
    // Claude Code sessions keep their own checkouts under .claude/worktrees; their tests are not ours.
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
});
