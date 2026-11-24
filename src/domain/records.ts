import type { DayKey } from './dates';
import type { AppData, DayRecord, Status } from './types';
import { LIMITS } from './types';

/** Sets or clears (null) the manual status of a task on a day. */
export function setTaskStatus(data: AppData, day: DayKey, taskId: string, status: Status | null): void {
  if (!data.tasks.some((t) => t.id === taskId)) return;
  const rec = ensureRecord(data, day);
  if (status === null) delete rec.tasks[taskId];
  else rec.tasks[taskId] = status;
  pruneRecord(data, day);
}

export function setJournal(data: AppData, day: DayKey, text: string): void {
  const rec = ensureRecord(data, day);
  rec.journal = text.slice(0, LIMITS.journal);
  pruneRecord(data, day);
}

export function emptyRecord(): DayRecord {
  return { tasks: {}, water: {}, journal: '' };
}

/** Read-only view of a day; returns a fresh empty record when nothing is stored. */
export function getRecord(data: AppData, day: DayKey): DayRecord {
  return data.days[day] ?? emptyRecord();
}

/** Record to mutate; creates and stores it when missing. */
export function ensureRecord(data: AppData, day: DayKey): DayRecord {
  let rec = data.days[day];
  if (!rec) {
    rec = emptyRecord();
    data.days[day] = rec;
  }
  return rec;
}

/** Drops records that hold no information, keeping storage small. */
export function pruneRecord(data: AppData, day: DayKey): void {
  const rec = data.days[day];
  if (!rec) return;
  const hasWater = Object.values(rec.water).some((e) => e.count > 0);
  if (Object.keys(rec.tasks).length === 0 && !hasWater && rec.journal.trim() === '') {
    delete data.days[day];
  }
}
