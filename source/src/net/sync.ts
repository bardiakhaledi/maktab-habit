import { createDefaultData, migrateDefaults } from '../domain/defaults';
import { todayKey } from '../domain/dates';
import type { AppData } from '../domain/types';
import { STORAGE_KEY } from '../storage/storage';
import { parseAppData } from '../storage/schema';
import { store } from '../ui/store';
import { api, ApiError, OfflineError, timeZone, type User } from './api';
import { mergeData } from './merge';

/**
 * Keeps the device copy (localStorage, works offline) and the server copy in
 * step. Every change is saved locally at once and pushed to the server shortly
 * after; when another device saved in between, the two are merged.
 */

const AUTH_KEY = 'maktab.auth.v1';
const META_KEY = 'maktab.sync.v1';
const PUSH_DELAY_MS = 800;
/** Browsers cap keepalive request bodies at 64 KB. */
const KEEPALIVE_MAX = 60_000;
const RETRY_MS = 60_000;

interface SyncMeta {
  /** Account the local data belongs to. Absent on data from before accounts existed. */
  userId?: number;
  /** Server revision the local copy is based on. */
  rev: number;
  /** Last copy the server confirmed (common ancestor for merges). */
  base: AppData | null;
}

export type SyncState = 'synced' | 'pending' | 'offline' | 'error';

let meta: SyncMeta = { rev: 0, base: null };
let timer = 0;
let inFlight: Promise<void> | null = null;
let again = false;
let state: SyncState = 'pending';
let started = false;
let onUnauthorized: () => void = () => undefined;
const stateListeners: (() => void)[] = [];

// ---------------------------------------------------------------- local auth & meta

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: the server copy still works */
  }
}

export function loadAuth(): User | null {
  const u = readJson<User>(AUTH_KEY);
  return u && typeof u.id === 'number' && typeof u.name === 'string' && typeof u.phone === 'string' ? u : null;
}

function loadMeta(): SyncMeta {
  const m = readJson<SyncMeta>(META_KEY);
  if (!m || typeof m.rev !== 'number') return { rev: 0, base: null };
  let base: AppData | null = null;
  try {
    base = m.base ? parseAppData(m.base) : null;
  } catch {
    base = null;
  }
  const out: SyncMeta = { rev: m.rev, base };
  if (typeof m.userId === 'number') out.userId = m.userId;
  return out;
}

const saveMeta = (): void => writeJson(META_KEY, meta);

/**
 * Called right after a successful sign-in / sign-up. Data on this device is
 * kept when it belongs to the same account (or predates accounts); another
 * account's data is replaced with a fresh start so people never see each other's entries.
 */
export function adoptAccount(user: User): void {
  const current = loadMeta();
  writeJson(AUTH_KEY, user);
  if (current.userId === undefined || current.userId === user.id) {
    meta = { ...current, userId: user.id };
  } else {
    meta = { userId: user.id, rev: 0, base: null };
    store.replaceData(createDefaultData(todayKey()), { keepUi: false });
  }
  saveMeta();
}

/** Removes the account and its data from this device. */
export function clearDevice(): void {
  for (const key of [AUTH_KEY, META_KEY, STORAGE_KEY]) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------- state

export function syncState(): SyncState {
  return state;
}

export function onSyncState(listener: () => void): void {
  stateListeners.push(listener);
}

function setState(next: SyncState): void {
  if (next === state) return;
  state = next;
  for (const l of stateListeners) l();
}

/** True while this device holds changes the server hasn't confirmed. */
export const hasUnsentChanges = (): boolean => isDirty();

const isDirty = (): boolean => meta.base === null || JSON.stringify(store.data) !== JSON.stringify(meta.base);
const snapshot = (d: AppData): AppData => JSON.parse(JSON.stringify(d)) as AppData;

/** Parses data from the server; null when it is missing or unreadable. */
function parseServer(raw: unknown): AppData | null {
  if (!raw) return null;
  try {
    const data = parseAppData(raw);
    migrateDefaults(data);
    return data;
  } catch {
    return null;
  }
}

/** Brings in the server's copy at `rev`, merging when this device has unsent changes. */
function integrate(rev: number, serverRaw: unknown): boolean {
  const server = parseServer(serverRaw);
  if (!server) {
    // Nothing usable on the server: this device's copy becomes the server copy.
    meta.rev = rev;
    saveMeta();
    return true;
  }
  // A device that never synced and holds no entries simply takes the account's copy.
  const pristine = meta.base === null && Object.keys(store.data.days).length === 0;
  const next = !pristine && isDirty() ? mergeData(meta.base, store.data, server) : server;
  meta.rev = rev;
  meta.base = server;
  saveMeta();
  if (JSON.stringify(next) !== JSON.stringify(store.data)) store.replaceData(next, { keepUi: true, silent: true });
  return JSON.stringify(next) !== JSON.stringify(server);
}

function handleError(err: unknown): void {
  if (err instanceof ApiError && err.status === 401) {
    setState('error');
    onUnauthorized();
    return;
  }
  setState(err instanceof OfflineError ? 'offline' : 'error');
}

// ---------------------------------------------------------------- pull & push

async function pull(): Promise<void> {
  const res = await api<{ rev: number; data: unknown }>('GET', 'data');
  if (res.rev === meta.rev && meta.base !== null) {
    if (isDirty()) await push();
    else setState('synced');
    return;
  }
  const needsPush = integrate(res.rev, res.data);
  if (needsPush || isDirty()) await push();
  else setState('synced');
}

async function push(keepalive = false): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const sent = snapshot(store.data);
    const body = { data: sent, baseRev: meta.rev, tz: timeZone() };
    // Too big for keepalive: send normally (it usually still finishes while the page is backgrounded).
    const useKeepalive = keepalive && JSON.stringify(body).length < KEEPALIVE_MAX;
    try {
      const res = await api<{ rev: number }>('PUT', 'data', body, { keepalive: useKeepalive });
      meta.rev = res.rev;
      meta.base = sent;
      saveMeta();
      setState(isDirty() ? 'pending' : 'synced');
      return;
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const body = err.body as { rev?: number; data?: unknown } | null;
        integrate(Number(body?.rev ?? 0), body?.data ?? null);
        continue; // retry with the merged copy on top of the newer revision
      }
      throw err;
    }
  }
  setState('error');
}

/** Runs one sync job at a time; a request during a run schedules one more run. */
function run(job: () => Promise<void>): Promise<void> {
  if (inFlight) {
    again = true;
    return inFlight;
  }
  inFlight = job()
    .catch(handleError)
    .finally(() => {
      inFlight = null;
      if (again) {
        again = false;
        void run(() => (isDirty() ? push() : Promise.resolve()));
      }
    });
  return inFlight;
}

function schedulePush(): void {
  setState('pending');
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void run(() => (isDirty() ? push() : Promise.resolve(setState('synced')))), PUSH_DELAY_MS);
}

/** Sends pending changes now (before logout or when the app goes to the background). */
export function flush(keepalive = false): Promise<void> {
  window.clearTimeout(timer);
  if (!isDirty()) return inFlight ?? Promise.resolve();
  return run(() => push(keepalive));
}

export function startSync(options: { onUnauthorized: () => void }): void {
  if (started) return;
  started = true;
  onUnauthorized = options.onUnauthorized;
  meta = loadMeta();
  store.onPersist = schedulePush;
  void run(pull);
  window.addEventListener('online', () => void run(pull));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void run(pull);
    else void flush(true);
  });
  window.setInterval(() => {
    if (document.visibilityState === 'visible' || state === 'offline' || state === 'error' || isDirty()) void run(pull);
  }, RETRY_MS);
}
