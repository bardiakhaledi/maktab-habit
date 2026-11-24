// Pure helpers for the nightly reminder (no I/O, unit-tested).

/** Calendar day ("2026-11-24") and minutes since midnight in a time zone. */
export function localNow(timeZone, now = new Date()) {
  let parts;
  try {
    parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
  } catch {
    return localNow('Asia/Tehran', now);
  }
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '00';
  return { day: `${get('year')}-${get('month')}-${get('day')}`, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

export function isValidTimeZone(tz) {
  if (typeof tz !== 'string' || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** "21:30" → 1290 */
export function parseClock(value) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? ''));
  if (!m) return 21 * 60 + 30;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return 21 * 60 + 30;
  return h * 60 + min;
}

const waterTotal = (rec) => Object.values(rec?.water ?? {}).reduce((sum, e) => sum + (Number(e?.ml) || 0) * (Number(e?.count) || 0), 0);

/**
 * Names of the tasks that are not "done" on `day`, mirroring the app's scoring
 * rules (src/domain/scoring.ts): water comes from the logged total and that
 * day's goal, the journal task auto-completes once journal text exists.
 */
export function incompleteTasks(data, day) {
  if (!data || !Array.isArray(data.tasks)) return [];
  const rec = data.days?.[day] ?? { tasks: {}, water: {}, journal: '' };
  const goal = rec.waterGoal ?? data.waterGoal ?? { fullMl: 3000, partialMl: 1500 };
  const out = [];
  for (const task of data.tasks) {
    if (!task || typeof task.name !== 'string') continue;
    if (task.createdOn !== null && typeof task.createdOn === 'string' && task.createdOn > day) continue;
    let status;
    if (task.link === 'water') {
      status = waterTotal(rec) >= goal.fullMl ? 'done' : 'not-done';
    } else {
      status = rec.tasks?.[task.id];
      if (!status && task.link === 'journal' && typeof rec.journal === 'string' && rec.journal.trim() !== '') status = 'done';
    }
    if (status !== 'done') out.push(task.name);
  }
  return out;
}

/** Notification text for the list of unfinished task names. */
export function reminderPayload(names) {
  return {
    title: 'یادآوری شبانه‌ی مکتب',
    body: `${names.length} کار امروز مانده: ${names.join('، ')}`,
    tag: 'maktab-nightly',
    url: './',
  };
}

/** Iranian mobile numbers in any common form (Persian/Arabic digits, +98, 0098, 9…) → "09xxxxxxxxx". */
export function normalizePhone(raw) {
  const ascii = String(raw ?? '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[\s\-()]/g, '');
  let n = ascii;
  if (n.startsWith('+98')) n = `0${n.slice(3)}`;
  else if (n.startsWith('0098')) n = `0${n.slice(4)}`;
  else if (/^9\d{9}$/.test(n)) n = `0${n}`;
  return /^09\d{9}$/.test(n) ? n : null;
}
