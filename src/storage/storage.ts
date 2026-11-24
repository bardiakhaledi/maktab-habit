import type { DayKey } from '../domain/dates';
import { createDefaultData, migrateDefaults } from '../domain/defaults';
import type { AppData } from '../domain/types';
import { SCHEMA_VERSION } from '../domain/types';
import { parseAppData } from './schema';

export const STORAGE_KEY = 'maktab.habit.v1';
const CORRUPT_PREFIX = 'maktab.habit.corrupt.';
const BACKUP_APP_ID = 'maktab-habit';

/** Minimal subset of the Web Storage API, so tests can inject a fake. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface LoadResult {
  data: AppData;
  /** True when stored data was unreadable and a fresh start was made (a copy is kept aside). */
  recovered: boolean;
  /** True when this is the first launch on this device. */
  fresh: boolean;
  /** True when stored data was upgraded on load and should be saved back. */
  migrated?: boolean;
}

export function loadData(store: KeyValueStore, today: DayKey): LoadResult {
  let raw: string | null;
  try {
    raw = store.getItem(STORAGE_KEY);
  } catch {
    // Storage disabled (private mode, blocked site data): run in memory only.
    return { data: createDefaultData(today), recovered: false, fresh: true };
  }
  if (raw === null) {
    return { data: createDefaultData(today), recovered: false, fresh: true };
  }
  try {
    const data = parseAppData(JSON.parse(raw));
    const migrated = migrateDefaults(data);
    return { data, recovered: false, fresh: false, migrated };
  } catch {
    // Never silently discard user data: keep the unreadable copy aside.
    try {
      store.setItem(`${CORRUPT_PREFIX}${Date.now()}`, raw);
    } catch {
      /* best effort */
    }
    return { data: createDefaultData(today), recovered: true, fresh: false };
  }
}

export type SaveResult = { ok: true } | { ok: false; reason: 'quota' | 'unavailable' };

export function saveData(store: KeyValueStore, data: AppData): SaveResult {
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(data));
    return { ok: true };
  } catch (err) {
    const quota = err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22);
    return { ok: false, reason: quota ? 'quota' : 'unavailable' };
  }
}

interface BackupFile {
  app: typeof BACKUP_APP_ID;
  schemaVersion: typeof SCHEMA_VERSION;
  exportedAt: string;
  data: AppData;
}

export function serializeBackup(data: AppData, now: Date = new Date()): string {
  const file: BackupFile = { app: BACKUP_APP_ID, schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), data };
  return JSON.stringify(file);
}

export type ImportResult = { ok: true; data: AppData; exportedAt: string } | { ok: false; error: string };

export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

export function parseBackup(text: string): ImportResult {
  if (text.length > MAX_BACKUP_BYTES) return { ok: false, error: 'فایل بیش از حد بزرگ است.' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'این فایل، فایل پشتیبان معتبر نیست.' };
  }
  if (typeof parsed !== 'object' || parsed === null || (parsed as { app?: unknown }).app !== BACKUP_APP_ID) {
    return { ok: false, error: 'این فایل، فایل پشتیبان مکتب نیست.' };
  }
  const file = parsed as Partial<BackupFile>;
  if (file.schemaVersion !== SCHEMA_VERSION) {
    return { ok: false, error: 'نسخه‌ی این فایل پشتیبان پشتیبانی نمی‌شود.' };
  }
  try {
    const data = parseAppData(file.data);
    migrateDefaults(data);
    return { ok: true, data, exportedAt: typeof file.exportedAt === 'string' ? file.exportedAt : '' };
  } catch {
    return { ok: false, error: 'محتوای فایل پشتیبان خراب است.' };
  }
}
