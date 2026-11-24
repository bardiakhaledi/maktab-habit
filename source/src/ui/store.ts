import {
  compareMonths,
  isDayKey,
  monthOf,
  todayKey,
  type DayKey,
  type JalaliMonth,
} from '../domain/dates';
import type { AppData } from '../domain/types';
import type { User } from '../net/api';
import { loadData, saveData, type KeyValueStore } from '../storage/storage';

export type Tab = 'today' | 'water' | 'history' | 'dashboard' | 'stats' | 'settings';
const TABS: readonly Tab[] = ['today', 'water', 'history', 'dashboard', 'stats', 'settings'];

export interface UiState {
  tab: Tab;
  /** Day shown on the Today and Water screens. Never in the future. */
  activeDay: DayKey;
  /** Month shown on History, Dashboard and Stats. */
  viewMonth: JalaliMonth;
  editTasks: boolean;
  editContainers: boolean;
  /** Point selected on the monthly chart. */
  chartDay: DayKey | null;
}

const UI_KEY = 'maktab.habit.ui';

type Listener = () => void;

/**
 * Single source of truth for app data and UI state. Every data change goes
 * through `mutate`, which persists immediately (no "save" button to forget).
 */
class Store {
  private appData!: AppData;
  private uiState!: UiState;
  private listeners: Listener[] = [];
  private storage: KeyValueStore | null = null;
  private lastToday: DayKey = todayKey();
  saveErrorShown = false;
  onSaveError: ((reason: 'quota' | 'unavailable') => void) | null = null;
  /** Signed-in account (name and phone are shown in Settings). */
  user: User | null = null;
  /** False on a static host (GitHub Pages): no accounts, sync or reminders. */
  serverMode = true;
  /** Called after every user change is saved locally (used to sync to the server). */
  onPersist: (() => void) | null = null;
  recoveredFromCorruption = false;

  init(storage: KeyValueStore | null): void {
    this.storage = storage;
    const today = todayKey();
    this.lastToday = today;
    const result = storage
      ? loadData(storage, today)
      : loadData({ getItem: () => null, setItem: () => undefined }, today);
    this.appData = result.data;
    this.recoveredFromCorruption = result.recovered;
    if (result.fresh || result.migrated) this.persist();
    this.uiState = this.restoreUi(today);
  }

  /** False when the browser blocks storage: the app works but nothing survives a reload. */
  get persistent(): boolean {
    return this.storage !== null;
  }

  get data(): AppData {
    return this.appData;
  }

  get ui(): UiState {
    return this.uiState;
  }

  get today(): DayKey {
    return todayKey();
  }

  /** Earliest month the user can navigate to. */
  get minMonth(): JalaliMonth {
    const earliest = [this.appData.firstUse, ...Object.keys(this.appData.days)].sort()[0] ?? this.today;
    return monthOf(earliest);
  }

  get maxMonth(): JalaliMonth {
    return monthOf(this.today);
  }

  subscribe(listener: Listener): void {
    this.listeners.push(listener);
  }

  mutate(change: (data: AppData) => void, options: { render?: boolean } = {}): void {
    change(this.appData);
    this.persist();
    this.onPersist?.();
    if (options.render !== false) this.emit();
  }

  /**
   * Swaps in a whole new data set (backup restore, server copy).
   * `keepUi` leaves the current screen as it is; `silent` skips the sync hook
   * (the data came from the server, so there is nothing to send back).
   */
  replaceData(next: AppData, options: { keepUi?: boolean; silent?: boolean } = {}): void {
    this.appData = next;
    this.persist();
    if (!options.silent) this.onPersist?.();
    if (!options.keepUi) {
      this.uiState = { ...this.uiState, activeDay: this.today, viewMonth: monthOf(this.today), chartDay: null };
    }
    // Keep the viewed month inside the (possibly changed) allowed range.
    if (compareMonths(this.uiState.viewMonth, this.minMonth) < 0) this.uiState = { ...this.uiState, viewMonth: this.minMonth };
    // Don't re-render under the user's fingers while they type in the journal.
    const typing = document.activeElement instanceof HTMLTextAreaElement;
    if (!typing) this.emit();
  }

  setUi(patch: Partial<UiState>): void {
    const next = { ...this.uiState, ...patch };
    // Guard rails: no future days, months within the allowed range.
    if (next.activeDay > this.today) next.activeDay = this.today;
    if (compareMonths(next.viewMonth, this.maxMonth) > 0) next.viewMonth = this.maxMonth;
    if (compareMonths(next.viewMonth, this.minMonth) < 0) next.viewMonth = this.minMonth;
    this.uiState = next;
    this.saveUi();
    this.emit();
  }

  /** Call periodically: moves the app forward when the local date changes (midnight). */
  checkDayRollover(): void {
    const today = this.today;
    if (today === this.lastToday) return;
    const wasOnToday = this.uiState.activeDay === this.lastToday;
    this.lastToday = today;
    this.setUi(wasOnToday ? { activeDay: today, viewMonth: monthOf(today) } : {});
  }

  private emit(): void {
    for (const l of this.listeners) l();
  }

  private persist(): void {
    if (!this.storage) return;
    const result = saveData(this.storage, this.appData);
    if (!result.ok && this.onSaveError) this.onSaveError(result.reason);
  }

  private saveUi(): void {
    try {
      const { tab, activeDay, viewMonth } = this.uiState;
      sessionStorage.setItem(UI_KEY, JSON.stringify({ tab, activeDay, viewMonth }));
    } catch {
      /* session storage is optional */
    }
  }

  /** Restores the screen after a refresh in the same session; a new session opens on today. */
  private restoreUi(today: DayKey): UiState {
    const base: UiState = {
      tab: 'today',
      activeDay: today,
      viewMonth: monthOf(today),
      editTasks: false,
      editContainers: false,
      chartDay: null,
    };
    try {
      const raw = sessionStorage.getItem(UI_KEY);
      if (!raw) return base;
      const saved = JSON.parse(raw) as Partial<Record<keyof UiState, unknown>>;
      if (typeof saved.tab === 'string' && (TABS as readonly string[]).includes(saved.tab)) base.tab = saved.tab as Tab;
      if (isDayKey(saved.activeDay) && saved.activeDay <= today) base.activeDay = saved.activeDay;
      const vm = saved.viewMonth as Partial<JalaliMonth> | undefined;
      if (vm && Number.isInteger(vm.jy) && Number.isInteger(vm.jm) && vm.jm! >= 1 && vm.jm! <= 12) {
        const month = { jy: vm.jy!, jm: vm.jm! };
        if (compareMonths(month, monthOf(today)) <= 0) base.viewMonth = month;
      }
    } catch {
      /* ignore */
    }
    return base;
  }
}

export const store = new Store();
