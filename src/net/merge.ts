import type { AppData, DayRecord, Task } from '../domain/types';

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/** Field-level 3-way merge of one map (task statuses or water entries). */
function mergeMap<T>(base: Record<string, T>, local: Record<string, T>, server: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const key of new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(server)])) {
    const chosen = same(local[key], base[key]) ? server[key] : local[key];
    if (chosen !== undefined) out[key] = chosen;
  }
  return out;
}

const EMPTY: DayRecord = { tasks: {}, water: {}, journal: '' };

function mergeDay(base: DayRecord | undefined, local: DayRecord | undefined, server: DayRecord | undefined): DayRecord | undefined {
  if (same(local, base)) return server;
  if (same(server, base)) return local;
  // Both devices changed this day: merge field by field.
  const b = base ?? EMPTY;
  const l = local ?? EMPTY;
  const s = server ?? EMPTY;
  const rec: DayRecord = {
    tasks: mergeMap(b.tasks, l.tasks, s.tasks),
    water: mergeMap(b.water, l.water, s.water),
    journal: l.journal !== b.journal ? l.journal : s.journal,
  };
  const goal = l.waterGoal ?? s.waterGoal;
  if (goal) rec.waterGoal = goal;
  return rec;
}

/** Union of two task lists by id; `primary`'s order and versions win. */
function unionTasks(primary: Task[], secondary: Task[]): Task[] {
  const ids = new Set(primary.map((t) => t.id));
  return [...primary, ...secondary.filter((t) => !ids.has(t.id))];
}

/** Drops statuses of tasks that no longer exist, and days left empty. */
function pruneOrphans(data: AppData): AppData {
  const ids = new Set(data.tasks.map((t) => t.id));
  for (const [day, rec] of Object.entries(data.days)) {
    for (const id of Object.keys(rec.tasks)) if (!ids.has(id)) delete rec.tasks[id];
    const hasWater = Object.values(rec.water).some((e) => e.count > 0);
    if (Object.keys(rec.tasks).length === 0 && !hasWater && rec.journal.trim() === '') delete data.days[day];
  }
  return data;
}

/**
 * Three-way merge used when another device saved first.
 * `base` is the copy both sides started from (the last one the server confirmed).
 * Within a day, each task status, each water entry and the journal merge
 * separately, so a change on one device never wipes a different change on the other.
 * Settings blocks (tasks, containers, water goal) take whichever side changed them.
 */
export function mergeData(base: AppData | null, local: AppData, server: AppData): AppData {
  const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
  if (!base) {
    // No common ancestor (first sync of this device): keep everything from both sides,
    // the account's version winning for settings, this device's for the same day.
    return pruneOrphans(
      copy({
        ...server,
        tasks: unionTasks(server.tasks, local.tasks),
        containers: [...server.containers, ...local.containers.filter((c) => !server.containers.some((x) => x.id === c.id))],
        days: { ...server.days, ...local.days },
      }),
    );
  }
  const pick = <K extends 'tasks' | 'containers' | 'waterGoal'>(key: K): AppData[K] => (same(local[key], base[key]) ? server[key] : local[key]);

  const days: AppData['days'] = {};
  for (const day of new Set([...Object.keys(base.days), ...Object.keys(local.days), ...Object.keys(server.days)])) {
    const rec = mergeDay(base.days[day], local.days[day], server.days[day]);
    if (rec) days[day] = rec;
  }
  const merged: AppData = {
    schemaVersion: local.schemaVersion,
    firstUse: local.firstUse < server.firstUse ? local.firstUse : server.firstUse,
    tasks: pick('tasks'),
    containers: pick('containers'),
    waterGoal: pick('waterGoal'),
    days,
  };
  const dv = Math.max(local.defaultsVersion ?? 1, server.defaultsVersion ?? 1);
  if (dv > 1) merged.defaultsVersion = dv;
  return pruneOrphans(copy(merged));
}
