import { addDays, dayRange, type DayKey } from './dates';
import { getRecord } from './records';
import type { AppData, DayRecord, Status, Task } from './types';
import { goalForDay, waterStatus, waterTotalMl } from './water';

export const POINTS: Record<Status, number> = { done: 2, partial: 1, missed: 0 };

/** A day "counts" toward streaks at or above this percentage. */
export const STREAK_THRESHOLD = 70;

export interface Level {
  min: number;
  label: string;
  /** Token name used by the UI to colour the level. */
  tone: 'top' | 'great' | 'good' | 'low';
}

export const LEVELS: readonly Level[] = [
  { min: 90, label: 'فوق‌العاده', tone: 'top' },
  { min: 70, label: 'عالی', tone: 'great' },
  { min: 40, label: 'خوب', tone: 'good' },
  { min: 0, label: 'نیاز به بهبود', tone: 'low' },
];

export function levelFor(pct: number): Level {
  return LEVELS.find((l) => pct >= l.min) ?? LEVELS[LEVELS.length - 1]!;
}

/** Tasks that existed on `day`. Tasks added later don't lower past scores. */
export function tasksForDay(tasks: readonly Task[], day: DayKey): Task[] {
  return tasks.filter((t) => t.createdOn === null || t.createdOn <= day);
}

/**
 * Status of a task on a day, or `undefined` when nothing has been recorded.
 * - water: derived from the logged total and that day's goal.
 * - journal: a manual choice wins; otherwise "done" once journal text exists.
 */
export function effectiveStatus(data: AppData, task: Task, day: DayKey, rec: DayRecord = getRecord(data, day)): Status | undefined {
  if (task.link === 'water') {
    return waterStatus(waterTotalMl(rec), goalForDay(data, day));
  }
  const manual = rec.tasks[task.id];
  if (manual) return manual;
  if (task.link === 'journal' && rec.journal.trim() !== '') return 'done';
  return undefined;
}

/** Whether the user recorded anything on that day. Unrecorded days have no score. */
export function isRecorded(rec: DayRecord): boolean {
  return Object.keys(rec.tasks).length > 0 || waterTotalMl(rec) > 0 || rec.journal.trim() !== '';
}

export interface DayScore {
  score: number;
  max: number;
  /** 0..100, or null when nothing was recorded that day. */
  pct: number | null;
}

export function dayScore(data: AppData, day: DayKey): DayScore {
  const rec = getRecord(data, day);
  const tasks = tasksForDay(data.tasks, day);
  const max = tasks.length * POINTS.done;
  let score = 0;
  for (const task of tasks) {
    const status = effectiveStatus(data, task, day, rec);
    if (status) score += POINTS[status];
  }
  const pct = !isRecorded(rec) || max === 0 ? null : Math.round((score / max) * 100);
  return { score, max, pct };
}

export interface StreakInfo {
  current: number;
  best: number;
}

/**
 * Streak = consecutive days at or above the threshold.
 * Today is still in progress, so if it hasn't reached the threshold yet the
 * current streak is counted up to yesterday instead of being reset.
 */
export function streaks(data: AppData, today: DayKey): StreakInfo {
  const recordedDays = Object.keys(data.days).filter((d) => d <= today).sort();
  const start = [data.firstUse, ...recordedDays].filter((d) => d <= today).sort()[0] ?? today;
  const qualifies = (day: DayKey): boolean => {
    const { pct } = dayScore(data, day);
    return pct !== null && pct >= STREAK_THRESHOLD;
  };

  let best = 0;
  let run = 0;
  for (const day of dayRange(start, today)) {
    run = qualifies(day) ? run + 1 : 0;
    if (run > best) best = run;
  }

  let current = 0;
  let cursor = qualifies(today) ? today : addDays(today, -1);
  while (cursor >= start && qualifies(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  return { current, best };
}

export interface TaskRate {
  task: Task;
  /** 0..100 over recorded days in the range, or null when there were none. */
  rate: number | null;
}

/** Completion rate per task across the recorded days of a range. */
export function taskRates(data: AppData, days: readonly DayKey[]): TaskRate[] {
  return data.tasks.map((task) => {
    let earned = 0;
    let possible = 0;
    for (const day of days) {
      if (task.createdOn !== null && task.createdOn > day) continue;
      const rec = getRecord(data, day);
      if (!isRecorded(rec)) continue;
      possible += POINTS.done;
      const status = effectiveStatus(data, task, day, rec);
      if (status) earned += POINTS[status];
    }
    return { task, rate: possible === 0 ? null : Math.round((earned / possible) * 100) };
  });
}
