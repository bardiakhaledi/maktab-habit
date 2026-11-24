import type { DayKey } from './dates';

export const SCHEMA_VERSION = 1 as const;

/** Three-state result of a task on one day. Absence means "not recorded". */
export type Status = 'done' | 'partial' | 'missed';

export type CategoryId = 'morning' | 'day' | 'night';

/** Special behaviour attached to a task. */
export type TaskLink = 'water' | 'journal';

export interface Task {
  id: string;
  name: string;
  note: string;
  category: CategoryId;
  link?: TaskLink;
  /**
   * First day this task applies to. `null` for the built-in tasks, which apply
   * to every day. Days before this are scored without the task.
   */
  createdOn: DayKey | null;
}

export interface Container {
  id: string;
  name: string;
  ml: number;
}

export interface WaterGoal {
  /** Total at or above which water counts as "done". */
  fullMl: number;
  /** Total at or above which water counts as "partial". */
  partialMl: number;
}

/** Water logged on one day for one container (name and volume are snapshots). */
export interface WaterEntry {
  name: string;
  ml: number;
  count: number;
}

export interface DayRecord {
  tasks: Record<string, Status>;
  water: Record<string, WaterEntry>;
  /** Goal in force when water was first logged that day, so later goal edits don't rewrite history. */
  waterGoal?: WaterGoal;
  journal: string;
}

export interface AppData {
  schemaVersion: typeof SCHEMA_VERSION;
  /** Version of the built-in task list this data was last upgraded to (absent = 1). */
  defaultsVersion?: number;
  /** Day the app was first opened on this device. */
  firstUse: DayKey;
  tasks: Task[];
  containers: Container[];
  waterGoal: WaterGoal;
  days: Record<DayKey, DayRecord>;
}

export interface Category {
  id: CategoryId;
  index: string;
  label: string;
  title: string;
}

export const CATEGORIES: readonly Category[] = [
  { id: 'morning', index: '01', label: 'MORNING', title: 'روتین صبح' },
  { id: 'day', index: '02', label: 'DAYTIME', title: 'طول روز و سیستم‌ها' },
  { id: 'night', index: '03', label: 'EVENING', title: 'روتین شب' },
];

export const LIMITS = {
  taskName: 60,
  taskNote: 120,
  containerName: 40,
  containerMinMl: 10,
  containerMaxMl: 5000,
  goalMaxMl: 10000,
  journal: 5000,
} as const;
