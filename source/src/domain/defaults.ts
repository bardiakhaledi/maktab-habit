import { todayKey, type DayKey } from './dates';
import type { AppData, CategoryId, Container, Task, TaskLink, WaterGoal } from './types';
import { SCHEMA_VERSION } from './types';

interface DefaultTask {
  id: string;
  name: string;
  category: CategoryId;
  note?: string;
  link?: TaskLink;
}

/** Starting list for every new user (approved list, Nov 2026). */
const DEFAULT_TASKS: readonly DefaultTask[] = [
  // Morning
  { id: 't-bed', name: 'مرتب کردن تخت خواب', category: 'morning' },
  // Daytime
  { id: 't-water', name: 'آب', category: 'day', link: 'water' },
  { id: 't-exercise', name: 'ورزش', category: 'day' },
  { id: 't-food', name: 'تغذیه سالم', category: 'day' },
  { id: 't-reading', name: 'مطالعه', category: 'day' },
  { id: 't-language', name: 'یادگیری زبان', category: 'day' },
  { id: 't-learning', name: 'یادگیری مطلب جدید', category: 'day' },
  { id: 't-procrastination', name: 'دوری از اهمال‌کاری', category: 'day', note: 'انجام کارها در موعد مقرر بدون تعویق' },
  { id: 't-no-phone-bed', name: 'عدم استفاده از موبایل در رختخواب', category: 'day' },
  // Evening & night
  { id: 't-brush', name: 'مسواک شب', category: 'night' },
  { id: 't-meditation', name: 'مدیتیشن', category: 'night' },
  {
    id: 't-journal',
    name: 'ژورنال‌نویسی',
    category: 'night',
    link: 'journal',
    note: 'با نوشتن ژورنال امروز خودکار کامل می‌شود؛ قابل تغییر دستی',
  },
  { id: 't-planning', name: 'برنامه‌ریزی روز بعد', category: 'night', note: 'در دفترچه‌ی شخصی یا گوگل کلندر' },
];

/** Version of the built-in list. Stored data with an older version is migrated once. */
export const DEFAULTS_VERSION = 2;

/** Built-in tasks dropped in defaults v2 (removed together with their history). */
const REMOVED_IN_V2 = ['t-no-ig-morning', 't-minox-am', 't-sleep', 't-minox-pm', 't-no-ig-night'];

function toTask(t: DefaultTask): Task {
  const task: Task = { id: t.id, name: t.name, note: t.note ?? '', category: t.category, createdOn: null };
  if (t.link) task.link = t.link;
  return task;
}

/**
 * One-time upgrade of data created with an older built-in list. Only built-in
 * tasks (createdOn === null) are touched; the user's own tasks stay as they are.
 * Returns true when something changed.
 */
export function migrateDefaults(data: AppData, today: DayKey = todayKey()): boolean {
  if ((data.defaultsVersion ?? 1) >= DEFAULTS_VERSION) return false;
  const removed = new Set(REMOVED_IN_V2);
  data.tasks = data.tasks.filter((t) => !(t.createdOn === null && removed.has(t.id)));
  for (const rec of Object.values(data.days)) {
    for (const id of removed) delete rec.tasks[id];
  }
  for (const day of Object.keys(data.days)) {
    const rec = data.days[day]!;
    const hasWater = Object.values(rec.water).some((e) => e.count > 0);
    if (Object.keys(rec.tasks).length === 0 && !hasWater && rec.journal.trim() === '') delete data.days[day];
  }
  const bed = data.tasks.find((t) => t.id === 't-bed');
  if (bed && bed.name === 'مرتب کردن تخت') bed.name = 'مرتب کردن تخت خواب';
  const procrastination = data.tasks.find((t) => t.id === 't-procrastination');
  if (procrastination && procrastination.name === 'دوری از احمال‌کاری') procrastination.name = 'دوری از اهمال‌کاری';
  const planning = data.tasks.find((t) => t.id === 't-planning');
  if (planning && planning.note === 'ثبت در دفترچه فیزیکی شخصی') planning.note = 'در دفترچه‌ی شخصی یا گوگل کلندر';
  if (!data.tasks.some((t) => t.id === 't-no-phone-bed')) {
    // Counts from today on, so past scores and streaks stay as they were.
    const task: Task = { ...toTask(DEFAULT_TASKS.find((t) => t.id === 't-no-phone-bed')!), createdOn: today };
    // After the last daytime task, so it sits where it does for new users.
    const lastDay = data.tasks.map((t) => t.category).lastIndexOf('day');
    const firstNight = data.tasks.findIndex((t) => t.category === 'night');
    const at = lastDay >= 0 ? lastDay + 1 : firstNight >= 0 ? firstNight : data.tasks.length;
    data.tasks.splice(at, 0, task);
  }
  data.defaultsVersion = DEFAULTS_VERSION;
  return true;
}

/** Volumes from common Iranian retail sizes (researched Oct 2026). */
const DEFAULT_CONTAINERS: readonly Container[] = [
  { id: 'c-cooler-cup', name: 'لیوان آب‌سردکن', ml: 220 },
  { id: 'c-cafe-large', name: 'لیوان بزرگ کافه', ml: 360 },
  { id: 'c-bottle-small', name: 'بطری آب معدنی کوچک', ml: 500 },
  { id: 'c-bottle-large', name: 'بطری آب معدنی بزرگ', ml: 1500 },
];

export const DEFAULT_WATER_GOAL: WaterGoal = { fullMl: 3000, partialMl: 1500 };

export function createDefaultData(today: DayKey): AppData {
  const tasks: Task[] = DEFAULT_TASKS.map(toTask);
  return {
    schemaVersion: SCHEMA_VERSION,
    defaultsVersion: DEFAULTS_VERSION,
    firstUse: today,
    tasks,
    containers: DEFAULT_CONTAINERS.map((c) => ({ ...c })),
    waterGoal: { ...DEFAULT_WATER_GOAL },
    days: {},
  };
}
