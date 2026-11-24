import { describe, expect, it } from 'vitest';
import {
  addDays,
  dayKeyFromDate,
  dayKeyToJdn,
  formatLong,
  fromJalali,
  isDayKey,
  jdnToDayKey,
  monthDays,
  shiftMonth,
  toJalali,
  weekdayIndex,
} from '../src/domain/dates';
import { isJalaliLeapYear, jalaliMonthLength } from '../src/domain/jalali';

const intl = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

function intlJalali(key: string): { jy: number; jm: number; jd: number } {
  const parts = intl.formatToParts(new Date(`${key}T12:00:00Z`));
  const get = (type: string): number => Number(parts.find((p) => p.type === type)?.value);
  return { jy: get('year'), jm: get('month'), jd: get('day') };
}

describe('Jalali conversion', () => {
  it('matches the ICU Persian calendar for every day 2000–2060', () => {
    let key = '2000-01-01';
    let checked = 0;
    while (key <= '2060-12-31') {
      expect(toJalali(key), key).toEqual(intlJalali(key));
      key = addDays(key, 1);
      checked += 1;
    }
    expect(checked).toBeGreaterThan(22_000);
  });

  it('round-trips Jalali → Gregorian → Jalali for 1390–1430', () => {
    for (let jy = 1390; jy <= 1430; jy += 1) {
      for (let jm = 1; jm <= 12; jm += 1) {
        for (let jd = 1; jd <= jalaliMonthLength(jy, jm); jd += 1) {
          expect(toJalali(fromJalali(jy, jm, jd))).toEqual({ jy, jm, jd });
        }
      }
    }
  });

  it('knows known anchor dates', () => {
    expect(toJalali('2026-10-24')).toEqual({ jy: 1405, jm: 8, jd: 2 }); // 2 Aban 1405
    expect(toJalali('2026-08-23')).toEqual({ jy: 1405, jm: 6, jd: 1 }); // 1 Shahrivar 1405
    expect(fromJalali(1405, 1, 1)).toBe('2026-03-21'); // Nowruz 1405
  });

  it('handles leap years (Esfand has 30 days in a leap year)', () => {
    expect(isJalaliLeapYear(1403)).toBe(true);
    expect(isJalaliLeapYear(1404)).toBe(false);
    expect(jalaliMonthLength(1403, 12)).toBe(30);
    expect(jalaliMonthLength(1405, 12)).toBe(29);
    expect(monthDays({ jy: 1403, jm: 12 })).toHaveLength(30);
    expect(addDays(fromJalali(1403, 12, 30), 1)).toBe(fromJalali(1404, 1, 1));
  });

  it('month lengths are 31 ×6, 30 ×5, then 29/30', () => {
    expect([1, 2, 3, 4, 5, 6].map((m) => jalaliMonthLength(1405, m))).toEqual([31, 31, 31, 31, 31, 31]);
    expect([7, 8, 9, 10, 11].map((m) => jalaliMonthLength(1405, m))).toEqual([30, 30, 30, 30, 30]);
  });
});

describe('Weekdays', () => {
  it('Persian weekday index matches JS Date.getDay for 10 years', () => {
    // JS: 0 = Sunday … 6 = Saturday. Persian: 0 = Saturday … 6 = Friday.
    let key = '2024-01-01';
    while (key <= '2034-01-01') {
      const js = new Date(`${key}T12:00:00Z`).getUTCDay();
      expect(weekdayIndex(key), key).toBe((js + 1) % 7);
      key = addDays(key, 30);
    }
  });

  it('formats 2 Aban 1405 as Saturday', () => {
    expect(formatLong('2026-10-24')).toBe('شنبه، 2 آبان 1405');
    expect(formatLong('2026-08-23')).toBe('یکشنبه، 1 شهریور 1405');
  });
});

describe('Day keys', () => {
  it('uses local calendar fields, not UTC', () => {
    // 00:30 local on 25 Oct is still the 25th locally even if UTC is the 24th.
    const local = new Date(2026, 9, 25, 0, 30);
    expect(dayKeyFromDate(local)).toBe('2026-10-25');
    const late = new Date(2026, 9, 24, 23, 59);
    expect(dayKeyFromDate(late)).toBe('2026-10-24');
  });

  it('validates keys strictly', () => {
    expect(isDayKey('2026-10-24')).toBe(true);
    expect(isDayKey('2026-02-31')).toBe(false);
    expect(isDayKey('2026-1-1')).toBe(false);
    expect(isDayKey(20261024)).toBe(false);
  });

  it('jdn round-trip', () => {
    expect(jdnToDayKey(dayKeyToJdn('1999-12-31'))).toBe('1999-12-31');
  });

  it('shifts months across years', () => {
    expect(shiftMonth({ jy: 1405, jm: 12 }, 1)).toEqual({ jy: 1406, jm: 1 });
    expect(shiftMonth({ jy: 1405, jm: 1 }, -1)).toEqual({ jy: 1404, jm: 12 });
    expect(shiftMonth({ jy: 1405, jm: 8 }, 6)).toEqual({ jy: 1406, jm: 2 });
  });
});
