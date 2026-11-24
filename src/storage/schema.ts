import { isDayKey } from '../domain/dates';
import type { AppData, Container, DayRecord, Status, Task, WaterEntry, WaterGoal } from '../domain/types';
import { CATEGORIES, LIMITS, SCHEMA_VERSION } from '../domain/types';

/**
 * Strict structural validation of persisted data. Anything coming from
 * localStorage or an imported backup file is untrusted until it passes here.
 */

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown, max = 10_000): v is string => typeof v === 'string' && v.length <= max;
const isPosInt = (v: unknown, max: number): v is number => Number.isInteger(v) && (v as number) > 0 && (v as number) <= max;
const STATUSES = new Set<string>(['done', 'partial', 'missed']);
const CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id));

export class SchemaError extends Error {
  constructor(path: string) {
    super(`Invalid data at ${path}`);
    this.name = 'SchemaError';
  }
}

function parseGoal(v: unknown, path: string): WaterGoal {
  if (!isObj(v) || !isPosInt(v.fullMl, LIMITS.goalMaxMl) || !isPosInt(v.partialMl, LIMITS.goalMaxMl) || v.fullMl <= v.partialMl) {
    throw new SchemaError(path);
  }
  return { fullMl: v.fullMl, partialMl: v.partialMl };
}

function parseTask(v: unknown, path: string): Task {
  if (!isObj(v) || !isStr(v.id, 80) || !v.id || !isStr(v.name, LIMITS.taskName) || !v.name.trim() || !isStr(v.note, LIMITS.taskNote)) {
    throw new SchemaError(path);
  }
  if (typeof v.category !== 'string' || !CATEGORY_IDS.has(v.category)) throw new SchemaError(`${path}.category`);
  if (v.createdOn !== null && !isDayKey(v.createdOn)) throw new SchemaError(`${path}.createdOn`);
  const task: Task = { id: v.id, name: v.name, note: v.note, category: v.category as Task['category'], createdOn: v.createdOn };
  if (v.link !== undefined) {
    if (v.link !== 'water' && v.link !== 'journal') throw new SchemaError(`${path}.link`);
    task.link = v.link;
  }
  return task;
}

function parseContainer(v: unknown, path: string): Container {
  if (!isObj(v) || !isStr(v.id, 80) || !v.id || !isStr(v.name, LIMITS.containerName) || !isPosInt(v.ml, LIMITS.containerMaxMl)) {
    throw new SchemaError(path);
  }
  return { id: v.id, name: v.name, ml: v.ml };
}

function parseRecord(v: unknown, path: string): DayRecord {
  if (!isObj(v) || !isObj(v.tasks) || !isObj(v.water) || !isStr(v.journal, LIMITS.journal)) throw new SchemaError(path);
  const tasks: Record<string, Status> = {};
  for (const [id, status] of Object.entries(v.tasks)) {
    if (typeof status !== 'string' || !STATUSES.has(status)) throw new SchemaError(`${path}.tasks.${id}`);
    tasks[id] = status as Status;
  }
  const water: Record<string, WaterEntry> = {};
  for (const [id, entry] of Object.entries(v.water)) {
    if (!isObj(entry) || !isStr(entry.name, LIMITS.containerName) || !isPosInt(entry.ml, LIMITS.containerMaxMl) || !isPosInt(entry.count, 1000)) {
      throw new SchemaError(`${path}.water.${id}`);
    }
    water[id] = { name: entry.name, ml: entry.ml, count: entry.count };
  }
  const rec: DayRecord = { tasks, water, journal: v.journal };
  if (v.waterGoal !== undefined) rec.waterGoal = parseGoal(v.waterGoal, `${path}.waterGoal`);
  return rec;
}

export function parseAppData(raw: unknown): AppData {
  if (!isObj(raw)) throw new SchemaError('root');
  if (raw.schemaVersion !== SCHEMA_VERSION) throw new SchemaError('schemaVersion');
  if (!isDayKey(raw.firstUse)) throw new SchemaError('firstUse');
  if (!Array.isArray(raw.tasks) || raw.tasks.length > 200) throw new SchemaError('tasks');
  if (!Array.isArray(raw.containers) || raw.containers.length > 50) throw new SchemaError('containers');
  if (!isObj(raw.days)) throw new SchemaError('days');

  const tasks = raw.tasks.map((t, i) => parseTask(t, `tasks[${i}]`));
  if (new Set(tasks.map((t) => t.id)).size !== tasks.length) throw new SchemaError('tasks (duplicate id)');
  const containers = raw.containers.map((c, i) => parseContainer(c, `containers[${i}]`));
  if (new Set(containers.map((c) => c.id)).size !== containers.length) throw new SchemaError('containers (duplicate id)');

  const days: Record<string, DayRecord> = {};
  for (const [day, rec] of Object.entries(raw.days)) {
    if (!isDayKey(day)) throw new SchemaError(`days.${day}`);
    days[day] = parseRecord(rec, `days.${day}`);
  }

  const data: AppData = {
    schemaVersion: SCHEMA_VERSION,
    firstUse: raw.firstUse,
    tasks,
    containers,
    waterGoal: parseGoal(raw.waterGoal, 'waterGoal'),
    days,
  };
  if (raw.defaultsVersion !== undefined) {
    if (!Number.isInteger(raw.defaultsVersion) || (raw.defaultsVersion as number) < 1 || (raw.defaultsVersion as number) > 1000) {
      throw new SchemaError('defaultsVersion');
    }
    data.defaultsVersion = raw.defaultsVersion as number;
  }
  return data;
}
