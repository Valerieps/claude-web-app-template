import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { precacheUrls, serviceWorkerSource } from '../service-worker-source.ts';

/** The offline service worker of ADR-005, run in a fake worker scope. */

const ORIGIN = 'https://app.example.com';
const BUILT = ['index.html', 'assets/index-abc.js', 'manifest.webmanifest', '_headers', 'sw.js'];

type Handler = (event: Record<string, unknown>) => void;

function load(version = 'v1') {
  const handlers: Record<string, Handler> = {};
  const stores = new Map<string, Map<string, string>>();
  const network: string[] = [];
  const keyOf = (request: string | { url: string }) =>
    new URL(typeof request === 'string' ? request : request.url, `${ORIGIN}/sw.js`).href;
  const caches = {
    open: async (name: string) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name)!;
      return {
        addAll: async (urls: string[]) => urls.forEach((url) => store.set(keyOf(url), `cached ${url}`)),
        match: async (request: string | { url: string }) => store.get(keyOf(request)),
      };
    },
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
  };
  const fetch = async (request: { url: string }) => {
    network.push(request.url);
    return `network ${request.url}`;
  };
  const self = { location: new URL(`${ORIGIN}/sw.js`), addEventListener: (type: string, fn: Handler) => (handlers[type] = fn) };
  runInNewContext(serviceWorkerSource(version, BUILT), { self, caches, fetch, URL, Promise });

  async function lifecycle(type: 'install' | 'activate') {
    let done: Promise<unknown> = Promise.resolve();
    handlers[type]({ waitUntil: (p: Promise<unknown>) => (done = p) });
    await done;
  }
  async function request(url: string, init: { method?: string; mode?: string } = {}) {
    let response: Promise<unknown> | undefined;
    handlers.fetch({ request: { url, method: init.method ?? 'GET', mode: init.mode ?? 'cors' }, respondWith: (r: Promise<unknown>) => (response = r) });
    return response === undefined ? 'passed through' : await response;
  }
  return { lifecycle, request, stores, network };
}

describe('precacheUrls', () => {
  it('keeps the page as ./ and leaves out what the browser never gets', () => {
    expect(precacheUrls(BUILT)).toEqual(['./', './assets/index-abc.js', './manifest.webmanifest']);
  });
});

describe('the service worker', () => {
  it('keeps every built file on install', async () => {
    const sw = load();
    await sw.lifecycle('install');
    expect([...sw.stores.get('app-v1')!.keys()]).toEqual([
      `${ORIGIN}/`,
      `${ORIGIN}/assets/index-abc.js`,
      `${ORIGIN}/manifest.webmanifest`,
    ]);
  });

  it('opens any page of the app from the cache, without the network', async () => {
    const sw = load();
    await sw.lifecycle('install');
    expect(await sw.request(`${ORIGIN}/estudar/123`, { mode: 'navigate' })).toBe('cached ./');
    expect(await sw.request(`${ORIGIN}/assets/index-abc.js`)).toBe('cached ./assets/index-abc.js');
    expect(sw.network).toEqual([]);
  });

  it('goes to the network for a file it does not have', async () => {
    const sw = load();
    await sw.lifecycle('install');
    expect(await sw.request(`${ORIGIN}/novo.png`)).toBe(`network ${ORIGIN}/novo.png`);
  });

  it('never touches other origins or requests that change data', async () => {
    const sw = load();
    expect(await sw.request('https://api.example.org/x')).toBe('passed through');
    expect(await sw.request(`${ORIGIN}/x`, { method: 'POST' })).toBe('passed through');
  });

  it('drops the caches of older versions when it takes over', async () => {
    const older = load('v1');
    await older.lifecycle('install');
    const newer = load('v2');
    for (const [name, store] of older.stores) newer.stores.set(name, store);
    await newer.lifecycle('install');
    await newer.lifecycle('activate');
    expect([...newer.stores.keys()]).toEqual(['app-v2']);
  });
});
