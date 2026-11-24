import { beforeEach, describe, expect, it } from 'vitest';
import { addDays } from '../src/domain/dates';
import { createDefaultData, DEFAULTS_VERSION, migrateDefaults } from '../src/domain/defaults';
import { getRecord, setJournal, setTaskStatus } from '../src/domain/records';
import { dayScore, effectiveStatus, levelFor, streaks, taskRates, tasksForDay } from '../src/domain/scoring';
import { addTask, deleteTask, moveTask, tasksInCategory, updateTask, validateTaskInput } from '../src/domain/tasks';
import type { AppData, CategoryId, Task } from '../src/domain/types';
import {
  adjustWater,
  deleteContainer,
  normalizeDigits,
  validateContainer,
  validateGoal,
  waterStatus,
  waterTotalMl,
} from '../src/domain/water';

const TODAY = '2026-10-24';
let data: AppData;

const task = (id: string): Task => {
  const t = data.tasks.find((x) => x.id === id);
  if (!t) throw new Error(`no task ${id}`);
  return t;
};

/** Marks every non-water task of a day with one status and logs `ml` of water. */
function fillDay(day: string, status: 'done' | 'partial' | 'missed', ml = 0): void {
  for (const t of data.tasks) if (t.link !== 'water') setTaskStatus(data, day, t.id, status);
  for (let left = ml; left > 0; left -= 500) adjustWater(data, day, 'c-bottle-small', 1);
}

beforeEach(() => {
  data = createDefaultData(TODAY);
});

describe('defaults', () => {
  it('ships exactly the approved list, in order', () => {
    expect(tasksInCategory(data, 'morning').map((t) => t.name)).toEqual(['مرتب کردن تخت خواب']);
    expect(tasksInCategory(data, 'day').map((t) => t.name)).toEqual([
      'آب',
      'ورزش',
      'تغذیه سالم',
      'مطالعه',
      'یادگیری زبان',
      'یادگیری مطلب جدید',
      'دوری از اهمال‌کاری',
      'عدم استفاده از موبایل در رختخواب',
    ]);
    expect(tasksInCategory(data, 'night').map((t) => t.name)).toEqual(['مسواک شب', 'مدیتیشن', 'ژورنال‌نویسی', 'برنامه‌ریزی روز بعد']);
    expect(data.tasks).toHaveLength(13);
    expect(data.defaultsVersion).toBe(DEFAULTS_VERSION);
  });

  it('ships the researched containers and the default 3 L / 1.5 L goal', () => {
    expect(data.containers.map((c) => c.ml)).toEqual([220, 360, 500, 1500]);
    expect(data.waterGoal).toEqual({ fullMl: 3000, partialMl: 1500 });
  });
});

describe('scoring', () => {
  it('unrecorded day has no percentage (shown as a gap, not zero)', () => {
    expect(dayScore(data, TODAY)).toEqual({ score: 0, max: 26, pct: null });
  });

  it('perfect day with 3 L water = 100%', () => {
    fillDay(TODAY, 'done', 3000);
    expect(dayScore(data, TODAY)).toEqual({ score: 26, max: 26, pct: 100 });
  });

  it('partial everywhere with 1.5 L water = 50%', () => {
    fillDay(TODAY, 'partial', 1500);
    expect(dayScore(data, TODAY).pct).toBe(50);
  });

  it('levels match the original thresholds', () => {
    expect(levelFor(95).label).toBe('فوق‌العاده');
    expect(levelFor(70).label).toBe('عالی');
    expect(levelFor(40).label).toBe('خوب');
    expect(levelFor(39).label).toBe('نیاز به بهبود');
  });

  it('a task added today does not lower yesterday’s score', () => {
    const yesterday = addDays(TODAY, -1);
    fillDay(yesterday, 'done', 3000);
    addTask(data, 'new', { name: 'تسک تازه', note: '', category: 'day' }, TODAY);
    expect(tasksForDay(data.tasks, yesterday)).toHaveLength(13);
    expect(dayScore(data, yesterday).pct).toBe(100);
    expect(dayScore(data, TODAY).max).toBe(28);
  });
});

describe('journal link', () => {
  it('writing a journal completes the journaling task automatically', () => {
    expect(effectiveStatus(data, task('t-journal'), TODAY)).toBeUndefined();
    setJournal(data, TODAY, 'امروز خوب بود');
    expect(effectiveStatus(data, task('t-journal'), TODAY)).toBe('done');
  });

  it('a manual choice overrides the automatic one, and clearing it restores auto', () => {
    setJournal(data, TODAY, 'متن');
    setTaskStatus(data, TODAY, 't-journal', 'partial');
    expect(effectiveStatus(data, task('t-journal'), TODAY)).toBe('partial');
    setTaskStatus(data, TODAY, 't-journal', null);
    expect(effectiveStatus(data, task('t-journal'), TODAY)).toBe('done');
  });

  it('manual "done" without any text (written in a paper notebook)', () => {
    setTaskStatus(data, TODAY, 't-journal', 'done');
    expect(effectiveStatus(data, task('t-journal'), TODAY)).toBe('done');
  });

  it('caps journal length', () => {
    setJournal(data, TODAY, 'x'.repeat(10_000));
    expect(getRecord(data, TODAY).journal).toHaveLength(5000);
  });
});

describe('water', () => {
  it('sums servings and derives status from the goal', () => {
    adjustWater(data, TODAY, 'c-cooler-cup', 1);
    adjustWater(data, TODAY, 'c-cooler-cup', 1);
    adjustWater(data, TODAY, 'c-bottle-large', 1);
    expect(waterTotalMl(getRecord(data, TODAY))).toBe(1940);
    expect(effectiveStatus(data, task('t-water'), TODAY)).toBe('partial');
    expect(waterStatus(3000, data.waterGoal)).toBe('done');
    expect(waterStatus(1499, data.waterGoal)).toBe('missed');
  });

  it('never goes below zero and removes empty entries', () => {
    adjustWater(data, TODAY, 'c-cooler-cup', -1);
    expect(data.days[TODAY]).toBeUndefined();
    adjustWater(data, TODAY, 'c-cooler-cup', 1);
    adjustWater(data, TODAY, 'c-cooler-cup', -1);
    expect(data.days[TODAY]).toBeUndefined();
  });

  it('water is stored per day (editing a past day does not touch today)', () => {
    const past = addDays(TODAY, -3);
    adjustWater(data, TODAY, 'c-bottle-small', 1);
    adjustWater(data, past, 'c-bottle-large', 1);
    expect(waterTotalMl(getRecord(data, TODAY))).toBe(500);
    expect(waterTotalMl(getRecord(data, past))).toBe(1500);
  });

  it('a goal change does not rewrite days that already logged water', () => {
    adjustWater(data, TODAY, 'c-bottle-large', 1);
    adjustWater(data, TODAY, 'c-bottle-small', 1); // 2000 ml, old goal → partial
    data.waterGoal = { fullMl: 2000, partialMl: 1000 };
    expect(effectiveStatus(data, task('t-water'), TODAY)).toBe('partial');
    const tomorrow = addDays(TODAY, 1);
    adjustWater(data, tomorrow, 'c-bottle-large', 1);
    adjustWater(data, tomorrow, 'c-bottle-small', 1);
    expect(effectiveStatus(data, task('t-water'), tomorrow)).toBe('done');
  });

  it('deleting a container keeps past totals', () => {
    adjustWater(data, TODAY, 'c-cafe-large', 1);
    deleteContainer(data, 'c-cafe-large');
    expect(waterTotalMl(getRecord(data, TODAY))).toBe(360);
    adjustWater(data, TODAY, 'c-cafe-large', -1);
    expect(data.days[TODAY]).toBeUndefined();
  });

  it('validates containers and goals, accepting Persian digits', () => {
    expect(validateContainer('فلاسک', '۷۵۰')).toEqual({ ok: true, value: { name: 'فلاسک', ml: 750 } });
    expect(validateContainer('', '200').ok).toBe(false);
    expect(validateContainer('x', '5').ok).toBe(false);
    expect(validateContainer('x', '1,500')).toEqual({ ok: true, value: { name: 'x', ml: 1500 } });
    expect(validateGoal('2.5', '1.2')).toEqual({ ok: true, value: { fullMl: 2500, partialMl: 1200 } });
    expect(validateGoal('۲٫۵', '۱')).toEqual({ ok: true, value: { fullMl: 2500, partialMl: 1000 } });
    expect(validateGoal('1', '2').ok).toBe(false);
    expect(normalizeDigits('۱۲۳')).toBe('123');
  });
});

describe('task customization', () => {
  it('validates input', () => {
    expect(validateTaskInput({ name: '  ', note: '', category: 'day' }).ok).toBe(false);
    expect(validateTaskInput({ name: 'a', note: '', category: 'nope' }).ok).toBe(false);
    expect(validateTaskInput({ name: '  دویدن   صبح ', note: '', category: 'morning' })).toEqual({
      ok: true,
      value: { name: 'دویدن صبح', note: '', category: 'morning' },
    });
  });

  it('adds at the end of its category, keeping categories contiguous', () => {
    addTask(data, 'x', { name: 'نرمش', note: '', category: 'morning' }, TODAY);
    const morning = tasksInCategory(data, 'morning');
    expect(morning[morning.length - 1]?.id).toBe('x');
    const cats = data.tasks.map((t) => t.category);
    expect(cats.indexOf('day')).toBeGreaterThan(cats.lastIndexOf('morning'));
  });

  it('renames and moves between the fixed categories', () => {
    updateTask(data, 't-bed', { name: 'مرتب کردن اتاق', note: 'n', category: 'night' });
    expect(task('t-bed').name).toBe('مرتب کردن اتاق');
    expect(tasksInCategory(data, 'night').at(-1)?.id).toBe('t-bed');
  });

  it('reorders within a category only', () => {
    moveTask(data, 't-exercise', -1);
    expect(tasksInCategory(data, 'day')[0]?.id).toBe('t-exercise');
    moveTask(data, 't-exercise', -1); // already first: no-op
    expect(tasksInCategory(data, 'day')[0]?.id).toBe('t-exercise');
    const lastDay = tasksInCategory(data, 'day').at(-1)!.id;
    moveTask(data, lastDay, 1); // must not jump into "night"
    expect(tasksInCategory(data, 'day').at(-1)?.id).toBe(lastDay);
  });

  it('delete removes the task and its whole history, and scores are recalculated', () => {
    const past = addDays(TODAY, -2);
    fillDay(past, 'done', 3000);
    setTaskStatus(data, past, 't-exercise', 'missed');
    const before = dayScore(data, past);
    expect(before.pct).toBe(92); // 24/26
    deleteTask(data, 't-exercise');
    expect(data.tasks.some((t) => t.id === 't-exercise')).toBe(false);
    expect(Object.values(data.days).some((r) => 't-exercise' in r.tasks)).toBe(false);
    expect(dayScore(data, past)).toEqual({ score: 24, max: 24, pct: 100 });
  });

  it('ignores status writes for unknown tasks', () => {
    setTaskStatus(data, TODAY, 'ghost', 'done');
    expect(data.days[TODAY]).toBeUndefined();
  });
});

describe('streaks', () => {
  it('counts consecutive ≥70% days; today in progress does not break it', () => {
    for (let i = 1; i <= 4; i += 1) fillDay(addDays(TODAY, -i), 'done', 3000);
    fillDay(addDays(TODAY, -5), 'missed');
    for (let i = 6; i <= 12; i += 1) fillDay(addDays(TODAY, -i), 'done', 3000);
    data.firstUse = addDays(TODAY, -12);
    expect(streaks(data, TODAY)).toEqual({ current: 4, best: 7 });
    fillDay(TODAY, 'done', 3000);
    expect(streaks(data, TODAY).current).toBe(5);
  });

  it('is zero when nothing is recorded', () => {
    expect(streaks(data, TODAY)).toEqual({ current: 0, best: 0 });
  });
});

describe('task rates', () => {
  it('averages over recorded days only', () => {
    fillDay(TODAY, 'done', 3000);
    fillDay(addDays(TODAY, -1), 'partial', 1500);
    const days = [addDays(TODAY, -2), addDays(TODAY, -1), TODAY];
    const rates = taskRates(data, days);
    expect(rates.find((r) => r.task.id === 't-exercise')?.rate).toBe(75);
    expect(rates.find((r) => r.task.id === 't-water')?.rate).toBe(75);
  });
});

describe('defaults migration (v1 → v2)', () => {
  function v1Data(): AppData {
    const d = createDefaultData(TODAY);
    delete d.defaultsVersion;
    const old = (id: string, name: string, category: CategoryId, note = '') => ({ id, name, note, category, createdOn: null });
    d.tasks = [
      old('t-no-ig-morning', 'بدون اینستاگرام بعد از بیدار شدن', 'morning'),
      old('t-minox-am', 'ماینوکسیدیل صبح', 'morning'),
      old('t-bed', 'مرتب کردن تخت', 'morning'),
      old('t-sleep', 'خواب', 'morning'),
      old('t-exercise', 'ورزش', 'day'),
      old('t-procrastination', 'دوری از احمال‌کاری', 'day'),
      { id: 'my-own', name: 'کار من', note: '', category: 'day', createdOn: TODAY },
      old('t-brush', 'مسواک شب', 'night'),
      old('t-minox-pm', 'ماینوکسیدیل شب', 'night'),
      old('t-planning', 'برنامه‌ریزی روز بعد', 'night', 'ثبت در دفترچه فیزیکی شخصی'),
    ];
    d.days = {
      [TODAY]: { tasks: { 't-minox-am': 'done', 't-exercise': 'done' }, water: {}, journal: '' },
      [addDays(TODAY, -1)]: { tasks: { 't-sleep': 'done' }, water: {}, journal: '' },
    };
    return d;
  }

  it('drops removed built-ins with their history, keeps own tasks, adds the new one', () => {
    const d = v1Data();
    expect(migrateDefaults(d, TODAY)).toBe(true);
    const ids = d.tasks.map((t) => t.id);
    // The added task counts only from the migration day: past scores don't change.
    expect(d.tasks.find((t) => t.id === 't-no-phone-bed')?.createdOn).toBe(TODAY);
    for (const gone of ['t-no-ig-morning', 't-minox-am', 't-sleep', 't-minox-pm']) expect(ids).not.toContain(gone);
    expect(ids).toContain('my-own');
    expect(tasksInCategory(d, 'day').at(-1)?.id).toBe('t-no-phone-bed');
    expect(d.tasks.find((t) => t.id === 't-procrastination')?.name).toBe('دوری از اهمال‌کاری');
    expect(d.tasks.find((t) => t.id === 't-bed')?.name).toBe('مرتب کردن تخت خواب');
    expect(d.days[TODAY]?.tasks).toEqual({ 't-exercise': 'done' });
    expect(d.days[addDays(TODAY, -1)]).toBeUndefined(); // held only removed-task data
    expect(d.defaultsVersion).toBe(DEFAULTS_VERSION);
  });

  it('runs once: a later deletion of the new task is respected', () => {
    const d = v1Data();
    migrateDefaults(d);
    deleteTask(d, 't-no-phone-bed');
    expect(migrateDefaults(d)).toBe(false);
    expect(d.tasks.some((t) => t.id === 't-no-phone-bed')).toBe(false);
  });

  it('keeps names the user renamed', () => {
    const d = v1Data();
    d.tasks.find((t) => t.id === 't-procrastination')!.name = 'اهمال نکن';
    migrateDefaults(d);
    expect(d.tasks.find((t) => t.id === 't-procrastination')?.name).toBe('اهمال نکن');
  });
});
