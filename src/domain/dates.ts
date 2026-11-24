import {
  gregorianToJdn,
  jalaliMonthLength,
  jalaliToJdn,
  jdnToGregorian,
  jdnToJalali,
  persianWeekday,
  type JalaliDate,
} from './jalali';

/**
 * A calendar day in the user's local time, stored as a Gregorian ISO date
 * ("2026-10-24"). It is sortable as a string and independent of time zones:
 * the day boundary is the device's local midnight, never UTC.
 */
export type DayKey = string;

export interface JalaliMonth {
  jy: number;
  jm: number;
}

export const MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

/** Persian week order, Saturday first. */
export const WEEKDAY_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'] as const;
export const WEEKDAY_INITIALS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const;

const DAY_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad2 = (n: number): string => String(n).padStart(2, '0');

export function isDayKey(value: unknown): value is DayKey {
  if (typeof value !== 'string') return false;
  const m = DAY_KEY_RE.exec(value);
  if (!m) return false;
  const gy = Number(m[1]);
  const gm = Number(m[2]);
  const gd = Number(m[3]);
  if (gm < 1 || gm > 12 || gd < 1 || gd > 31) return false;
  // Round-trip guards against impossible dates such as 2026-02-31.
  return jdnToDayKey(gregorianToJdn(gy, gm, gd)) === value;
}

/** Local calendar day of a Date (uses local fields, never toISOString). */
export function dayKeyFromDate(date: Date): DayKey {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function todayKey(now: Date = new Date()): DayKey {
  return dayKeyFromDate(now);
}

export function dayKeyToJdn(key: DayKey): number {
  const m = DAY_KEY_RE.exec(key);
  if (!m) throw new RangeError(`Invalid day key: ${key}`);
  return gregorianToJdn(Number(m[1]), Number(m[2]), Number(m[3]));
}

export function jdnToDayKey(jdn: number): DayKey {
  const { gy, gm, gd } = jdnToGregorian(jdn);
  return `${gy}-${pad2(gm)}-${pad2(gd)}`;
}

export function addDays(key: DayKey, days: number): DayKey {
  return jdnToDayKey(dayKeyToJdn(key) + days);
}

export function toJalali(key: DayKey): JalaliDate {
  return jdnToJalali(dayKeyToJdn(key));
}

export function fromJalali(jy: number, jm: number, jd: number): DayKey {
  return jdnToDayKey(jalaliToJdn(jy, jm, jd));
}

export function weekdayIndex(key: DayKey): number {
  return persianWeekday(dayKeyToJdn(key));
}

export function monthOf(key: DayKey): JalaliMonth {
  const { jy, jm } = toJalali(key);
  return { jy, jm };
}

export function monthDays(month: JalaliMonth): DayKey[] {
  const len = jalaliMonthLength(month.jy, month.jm);
  const start = jalaliToJdn(month.jy, month.jm, 1);
  return Array.from({ length: len }, (_, i) => jdnToDayKey(start + i));
}

export function shiftMonth(month: JalaliMonth, delta: number): JalaliMonth {
  const index = month.jy * 12 + (month.jm - 1) + delta;
  return { jy: Math.floor(index / 12), jm: (index % 12) + 1 };
}

export function compareMonths(a: JalaliMonth, b: JalaliMonth): number {
  return a.jy * 12 + a.jm - (b.jy * 12 + b.jm);
}

export function formatMonth(month: JalaliMonth): string {
  return `${MONTH_NAMES[month.jm - 1]} ${month.jy}`;
}

/** e.g. "شنبه، 2 آبان 1405" */
export function formatLong(key: DayKey): string {
  const { jy, jm, jd } = toJalali(key);
  return `${WEEKDAY_NAMES[weekdayIndex(key)]}، ${jd} ${MONTH_NAMES[jm - 1]} ${jy}`;
}

/** e.g. "شنبه، 2 آبان" — the year is omitted (used in the compact header). */
export function formatLongNoYear(key: DayKey): string {
  const { jm, jd } = toJalali(key);
  return `${WEEKDAY_NAMES[weekdayIndex(key)]}، ${jd} ${MONTH_NAMES[jm - 1]}`;
}

/** e.g. "2 آبان" */
export function formatShort(key: DayKey): string {
  const { jm, jd } = toJalali(key);
  return `${jd} ${MONTH_NAMES[jm - 1]}`;
}

/** Inclusive list of days from `from` to `to`. Empty when `from` is after `to`. */
export function dayRange(from: DayKey, to: DayKey): DayKey[] {
  const start = dayKeyToJdn(from);
  const end = dayKeyToJdn(to);
  const out: DayKey[] = [];
  for (let j = start; j <= end; j += 1) out.push(jdnToDayKey(j));
  return out;
}
