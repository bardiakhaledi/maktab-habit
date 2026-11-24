import type { DayKey } from './dates';
import { pruneRecord } from './records';
import type { AppData, CategoryId, Task } from './types';
import { CATEGORIES, LIMITS } from './types';
import type { ValidationResult } from './water';

export interface TaskInput {
  name: string;
  note: string;
  category: CategoryId;
}

const CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id));

export function validateTaskInput(input: { name: string; note: string; category: string }): ValidationResult<TaskInput> {
  const name = input.name.trim().replace(/\s+/g, ' ');
  const note = input.note.trim().replace(/\s+/g, ' ');
  if (!name) return { ok: false, error: 'نام تسک را بنویس.' };
  if (name.length > LIMITS.taskName) return { ok: false, error: `نام تسک حداکثر ${LIMITS.taskName} حرف است.` };
  if (note.length > LIMITS.taskNote) return { ok: false, error: `توضیح حداکثر ${LIMITS.taskNote} حرف است.` };
  if (!CATEGORY_IDS.has(input.category)) return { ok: false, error: 'دسته‌ی نامعتبر.' };
  return { ok: true, value: { name, note, category: input.category as CategoryId } };
}

export function tasksInCategory(data: AppData, category: CategoryId): Task[] {
  return data.tasks.filter((t) => t.category === category);
}

/** Appends a task at the end of its category. It applies from `today` onward. */
export function addTask(data: AppData, id: string, input: TaskInput, today: DayKey): Task {
  const task: Task = { id, name: input.name, note: input.note, category: input.category, createdOn: today };
  insertAtEndOfCategory(data, task);
  return task;
}

export function updateTask(data: AppData, id: string, input: TaskInput): void {
  const task = data.tasks.find((t) => t.id === id);
  if (!task) return;
  task.name = input.name;
  task.note = input.note;
  if (task.category !== input.category) {
    data.tasks = data.tasks.filter((t) => t.id !== id);
    task.category = input.category;
    insertAtEndOfCategory(data, task);
  }
}

/**
 * Deletes a task together with its whole history (product decision: no archive).
 * Past scores are recalculated without it automatically, because scores are
 * always derived from the current task list.
 */
export function deleteTask(data: AppData, id: string): void {
  data.tasks = data.tasks.filter((t) => t.id !== id);
  for (const day of Object.keys(data.days)) {
    const rec = data.days[day];
    if (rec && id in rec.tasks) {
      delete rec.tasks[id];
      pruneRecord(data, day);
    }
  }
}

/** Moves a task one step up (-1) or down (+1) inside its own category. */
export function moveTask(data: AppData, id: string, direction: -1 | 1): void {
  const task = data.tasks.find((t) => t.id === id);
  if (!task) return;
  const siblings = tasksInCategory(data, task.category);
  const pos = siblings.findIndex((t) => t.id === id);
  const target = siblings[pos + direction];
  if (!target) return;
  const a = data.tasks.indexOf(task);
  const b = data.tasks.indexOf(target);
  data.tasks[a] = target;
  data.tasks[b] = task;
}

function insertAtEndOfCategory(data: AppData, task: Task): void {
  const order = CATEGORIES.map((c) => c.id);
  const rank = order.indexOf(task.category);
  // Insert before the first task of a later category to keep categories contiguous.
  const index = data.tasks.findIndex((t) => order.indexOf(t.category) > rank);
  if (index === -1) data.tasks.push(task);
  else data.tasks.splice(index, 0, task);
}
