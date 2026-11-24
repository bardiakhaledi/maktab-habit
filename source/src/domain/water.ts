import type { DayKey } from './dates';
import { ensureRecord, getRecord, pruneRecord } from './records';
import type { AppData, Container, DayRecord, Status, WaterGoal } from './types';
import { LIMITS } from './types';

export function waterTotalMl(rec: DayRecord): number {
  let total = 0;
  for (const entry of Object.values(rec.water)) total += entry.ml * entry.count;
  return total;
}

export function waterStatus(totalMl: number, goal: WaterGoal): Status {
  if (totalMl >= goal.fullMl) return 'done';
  if (totalMl >= goal.partialMl) return 'partial';
  return 'missed';
}

/** Goal that applies to a day: its snapshot if water was logged, otherwise the current goal. */
export function goalForDay(data: AppData, day: DayKey): WaterGoal {
  return getRecord(data, day).waterGoal ?? data.waterGoal;
}

/**
 * Adds (+1) or removes (-1) one serving. Removal works for any entry already
 * logged that day, including entries of containers deleted since.
 */
export function adjustWater(data: AppData, day: DayKey, containerId: string, delta: 1 | -1): void {
  if (delta < 0) {
    const existing = data.days[day]?.water[containerId];
    if (!existing || existing.count === 0) return;
    existing.count -= 1;
    if (existing.count === 0) delete data.days[day]?.water[containerId];
    pruneRecord(data, day);
    return;
  }
  const existing = data.days[day]?.water[containerId];
  const container = data.containers.find((c) => c.id === containerId);
  if (!existing && !container) return;
  const rec = ensureRecord(data, day);
  if (existing) existing.count += 1;
  else if (container) rec.water[containerId] = { name: container.name, ml: container.ml, count: 1 };
  if (!rec.waterGoal) rec.waterGoal = { ...data.waterGoal };
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateContainer(nameRaw: string, mlRaw: string | number): ValidationResult<Omit<Container, 'id'>> {
  const name = nameRaw.trim();
  if (!name) return { ok: false, error: 'نام ظرف را بنویس.' };
  if (name.length > LIMITS.containerName) return { ok: false, error: `نام ظرف حداکثر ${LIMITS.containerName} حرف است.` };
  const ml = typeof mlRaw === 'number' ? mlRaw : Number(normalizeDigits(mlRaw.trim()).replace(/[,،٬]/g, ''));
  if (!Number.isInteger(ml) || ml < LIMITS.containerMinMl || ml > LIMITS.containerMaxMl) {
    return { ok: false, error: `حجم باید عدد صحیح بین ${LIMITS.containerMinMl} تا ${LIMITS.containerMaxMl} میلی‌لیتر باشد.` };
  }
  return { ok: true, value: { name, ml } };
}

export function addContainer(data: AppData, container: Container): void {
  data.containers.push(container);
}

/** Removes a container from the list. Past logs keep their own name/volume snapshot. */
export function deleteContainer(data: AppData, id: string): void {
  data.containers = data.containers.filter((c) => c.id !== id);
}

export function validateGoal(fullLitersRaw: string, partialLitersRaw: string): ValidationResult<WaterGoal> {
  const full = Number(normalizeDigits(fullLitersRaw.trim()));
  const partial = Number(normalizeDigits(partialLitersRaw.trim()));
  if (!Number.isFinite(full) || !Number.isFinite(partial)) return { ok: false, error: 'عدد معتبر وارد کن.' };
  const fullMl = Math.round(full * 1000);
  const partialMl = Math.round(partial * 1000);
  if (partialMl <= 0) return { ok: false, error: 'هدف «ناقص» باید بیشتر از صفر باشد.' };
  if (fullMl <= partialMl) return { ok: false, error: 'هدف «کامل» باید بیشتر از «ناقص» باشد.' };
  if (fullMl > LIMITS.goalMaxMl) return { ok: false, error: `هدف حداکثر ${LIMITS.goalMaxMl / 1000} لیتر است.` };
  return { ok: true, value: { fullMl, partialMl } };
}

/** Accepts Persian/Arabic-Indic digits and the Persian decimal separator from mobile keyboards. */
export function normalizeDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/٫/g, '.');
}
