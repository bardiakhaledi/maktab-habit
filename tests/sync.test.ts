import { describe, expect, it } from 'vitest';
import { createDefaultData } from '../src/domain/defaults';
import { setJournal, setTaskStatus } from '../src/domain/records';
import { mergeData } from '../src/net/merge';
// @ts-expect-error plain JS server module
import { incompleteTasks, localNow, normalizePhone, reminderPayload } from '../server/reminders.mjs';

const TODAY = '2026-11-24';
const YESTERDAY = '2026-11-23';
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

describe('mergeData', () => {
  it('keeps days each device changed and settings the other device changed', () => {
    const base = createDefaultData(TODAY);
    const local = clone(base);
    const server = clone(base);
    setTaskStatus(local, TODAY, 't-exercise', 'done');
    setJournal(server, YESTERDAY, 'دیروز');
    server.waterGoal = { fullMl: 2500, partialMl: 1000 };
    const merged = mergeData(base, local, server);
    expect(merged.days[TODAY]?.tasks['t-exercise']).toBe('done');
    expect(merged.days[YESTERDAY]?.journal).toBe('دیروز');
    expect(merged.waterGoal).toEqual({ fullMl: 2500, partialMl: 1000 });
  });

  it('merges the same day field by field: water on one phone, a tick on the other', () => {
    const base = createDefaultData(TODAY);
    const local = clone(base);
    const server = clone(base);
    local.days[TODAY] = { tasks: {}, water: { c: { name: 'b', ml: 500, count: 2 } }, journal: '' };
    setTaskStatus(server, TODAY, 't-exercise', 'done');
    const merged = mergeData(base, local, server);
    expect(merged.days[TODAY]?.water.c?.count).toBe(2);
    expect(merged.days[TODAY]?.tasks['t-exercise']).toBe('done');
  });

  it('drops statuses of a task the other device deleted', () => {
    const base = createDefaultData(TODAY);
    const local = clone(base);
    const server = clone(base);
    setTaskStatus(local, TODAY, 't-meditation', 'done');
    server.tasks = server.tasks.filter((t) => t.id !== 't-meditation');
    const merged = mergeData(base, local, server);
    expect(merged.tasks.some((t) => t.id === 't-meditation')).toBe(false);
    expect(merged.days[TODAY]).toBeUndefined();
  });

  it('this device wins when both changed the same field; a day deleted on the server stays deleted', () => {
    const base = createDefaultData(TODAY);
    setJournal(base, YESTERDAY, 'old');
    const local = clone(base);
    const server = clone(base);
    setTaskStatus(local, TODAY, 't-bed', 'done');
    setTaskStatus(server, TODAY, 't-bed', 'missed');
    setJournal(server, YESTERDAY, '');
    const merged = mergeData(base, local, server);
    expect(merged.days[TODAY]?.tasks['t-bed']).toBe('done');
    expect(merged.days[YESTERDAY]).toBeUndefined();
  });

  it('without a common base, keeps tasks from both sides and the union of days', () => {
    const local = createDefaultData(TODAY);
    const server = createDefaultData(YESTERDAY);
    local.tasks.push({ id: 'mine', name: 'کار گوشی', note: '', category: 'day', createdOn: TODAY });
    setJournal(local, TODAY, 'a');
    setJournal(server, YESTERDAY, 'b');
    const merged = mergeData(null, local, server);
    expect(merged.tasks.map((t) => t.id)).toContain('mine');
    expect(merged.tasks).toHaveLength(14);
    expect(Object.keys(merged.days).sort()).toEqual([YESTERDAY, TODAY]);
  });
});

describe('server reminder rules', () => {
  it('lists every task not yet done, honouring water and journal rules', () => {
    const d = createDefaultData(TODAY);
    setTaskStatus(d, TODAY, 't-bed', 'done');
    setTaskStatus(d, TODAY, 't-exercise', 'partial');
    setJournal(d, TODAY, 'شکرگزارم');
    const names: string[] = incompleteTasks(clone(d), TODAY);
    expect(names).not.toContain('مرتب کردن تخت خواب');
    expect(names).not.toContain('ژورنال‌نویسی');
    expect(names).toContain('ورزش');
    expect(names).toContain('آب');
    expect(names).toHaveLength(11);
    expect(reminderPayload(names).body).toContain('ورزش');
  });

  it('skips tasks created after the day and returns nothing when all done', () => {
    const d = createDefaultData(TODAY);
    for (const t of d.tasks) if (!t.link) setTaskStatus(d, TODAY, t.id, 'done');
    d.days[TODAY]!.water = { x: { name: 'b', ml: 1500, count: 2 } };
    setJournal(d, TODAY, 'x');
    d.tasks.push({ id: 'new', name: 'جدید', note: '', category: 'day', createdOn: '2026-12-01' });
    expect(incompleteTasks(clone(d), TODAY)).toEqual([]);
  });

  it('computes the local day and time in Tehran', () => {
    // 18:00 UTC = 21:30 in Tehran (UTC+3:30, no DST since 2022)
    expect(localNow('Asia/Tehran', new Date('2026-11-24T18:00:00Z'))).toEqual({ day: '2026-11-24', minutes: 21 * 60 + 30 });
    expect(localNow('Asia/Tehran', new Date('2026-11-24T21:00:00Z')).day).toBe('2026-11-25');
  });

  it('normalises Iranian mobile numbers', () => {
    expect(normalizePhone('۰۹۱۲ ۱۲۳ ۴۵۶۷')).toBe('09121234567');
    expect(normalizePhone('+989121234567')).toBe('09121234567');
    expect(normalizePhone('9121234567')).toBe('09121234567');
    expect(normalizePhone('12345')).toBeNull();
  });
});
