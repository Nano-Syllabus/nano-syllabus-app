import { useEffect, useState, useSyncExternalStore } from 'react';

// Cache-first data: a page paints from what we already have (server-embedded
// data, memory, or this tab's sessionStorage), then revalidates ONCE per page
// load. Writes patch the cache instead of refetching everything.

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(path, {
    method: init?.method ?? 'GET',
    credentials: 'same-origin',
    headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? 'Something went wrong.');
  return data as T;
}

const SS_KEY = 'ns-cache-v1';
const cache = new Map<string, unknown>();
const fresh = new Set<string>(); // revalidated during this page load
const inflight = new Map<string, Promise<unknown>>();
const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version++;
  listeners.forEach((l) => l());
}

// Seed from the server's <script id="__DATA__"> (exact data for this route,
// so it also counts as fresh) and from this tab's session cache.
(function seed() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SS_KEY) ?? '{}') as Record<string, unknown>;
    for (const [k, v] of Object.entries(saved)) cache.set(k, v);
  } catch {
    /* storage blocked: memory only */
  }
  const el = document.getElementById('__DATA__');
  if (el?.textContent) {
    try {
      for (const [k, v] of Object.entries(JSON.parse(el.textContent) as Record<string, unknown>)) {
        cache.set(k, v);
        fresh.add(k);
      }
    } catch {
      /* ignore a malformed payload */
    }
  }
})();

let persistTimer = 0;
function persist() {
  clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    try {
      sessionStorage.setItem(SS_KEY, JSON.stringify(Object.fromEntries(cache)));
    } catch {
      /* quota or blocked */
    }
  }, 200);
}

export function setCached<T>(key: string, value: T | ((prev: T | undefined) => T)) {
  const next = typeof value === 'function' ? (value as (p: T | undefined) => T)(cache.get(key) as T | undefined) : value;
  cache.set(key, next);
  persist();
  emit();
}

export function getCached<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

/** Forget keys so the next page that needs them fetches again. A key ending
 *  in "/" or ":" is a prefix ("subject:em/" drops every subject of course em). */
export function invalidate(...keys: string[]) {
  const hit = (k: string) => keys.some((key) => k === key || (/[/:]$/.test(key) && k.startsWith(key)));
  for (const k of [...cache.keys()]) {
    if (hit(k)) {
      cache.delete(k);
      fresh.delete(k);
    }
  }
  for (const key of keys) fresh.delete(key);
  persist();
  emit();
}

/** Drop everything (sign-in / sign-out changes what every response contains). */
export function clearCache() {
  cache.clear();
  fresh.clear();
  try {
    sessionStorage.removeItem(SS_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

function load(key: string, path: string) {
  let p = inflight.get(key);
  if (!p) {
    p = api(path).then(
      (data) => {
        fresh.add(key);
        setCached(key, data);
        return data;
      },
      (err) => {
        fresh.add(key); // don't hammer a failing endpoint on every render
        throw err;
      },
    );
    p.finally(() => inflight.delete(key)).catch(() => {});
    inflight.set(key, p);
  }
  return p;
}

/** Warm a key; resolves with its data (cached or fetched), or undefined on failure. */
export function prefetch<T = unknown>(key: string, path: string): Promise<T | undefined> {
  if (cache.has(key)) return Promise.resolve(cache.get(key) as T);
  return (load(key, path) as Promise<T>).catch(() => undefined);
}

export function useQuery<T>(key: string | null, path: string) {
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
  );
  const [error, setError] = useState<ApiError | null>(null);
  const data = key ? (cache.get(key) as T | undefined) : undefined;

  useEffect(() => {
    setError(null);
    if (!key || fresh.has(key)) return;
    load(key, path).catch((e) => setError(e instanceof ApiError ? e : new ApiError(0, 'Network error.')));
  }, [key, path]);

  return { data, error, loading: !!key && data === undefined && !error };
}

/** Several keys at once (a list page that needs every item's detail). Same
 *  rules as useQuery: paint from cache, fetch each key once per page load. */
export function useQueries<T>(pairs: [key: string, path: string][]) {
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
  );
  const sig = pairs.map((p) => p[0]).join('|');
  useEffect(() => {
    for (const [key, path] of pairs) if (!fresh.has(key)) load(key, path).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  return pairs.map(([key]) => cache.get(key) as T | undefined);
}
