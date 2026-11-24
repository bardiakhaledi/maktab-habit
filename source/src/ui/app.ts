import { formatLong, formatLongNoYear, formatMonth, monthOf, shiftMonth, todayKey, toJalali, type DayKey } from '../domain/dates';
import { setJournal, setTaskStatus } from '../domain/records';
import { addTask, deleteTask, moveTask, updateTask, validateTaskInput } from '../domain/tasks';
import type { CategoryId, Status } from '../domain/types';
import { CATEGORIES, LIMITS } from '../domain/types';
import { addContainer, adjustWater, deleteContainer, validateContainer, validateGoal } from '../domain/water';
import { api } from '../net/api';
import { clearDevice, flush, hasUnsentChanges, onSyncState } from '../net/sync';
import { disableReminders, dismissReminderBanner, enableReminders, onReminderState, promptInstall, testReminder } from '../pwa/push';
import { parseBackup, serializeBackup } from '../storage/storage';
import markUrl from '../assets/brand/mark-color-on-dark.svg';
import { esc } from './html';
import { icons } from './icons';
import { closeSheet, confirmSheet, isSheetOpen, mountOverlays, openSheet, toast, updateSheet } from './overlays';
import { monthGrid, monthNav, renderDashboard, renderHistory, renderStats } from './screens/month';
import { renderSettings } from './screens/settings';
import { renderToday } from './screens/today';
import { renderWater } from './screens/water';
import { store, type Tab } from './store';

const NAV: readonly { tab: Tab; label: string; icon: keyof typeof icons }[] = [
  { tab: 'today', label: 'امروز', icon: 'today' },
  { tab: 'water', label: 'آب‌سنج', icon: 'water' },
  { tab: 'history', label: 'تاریخچه', icon: 'history' },
  { tab: 'dashboard', label: 'داشبورد', icon: 'dashboard' },
  { tab: 'stats', label: 'آمار', icon: 'stats' },
];

const SCREENS: Record<Tab, () => string> = {
  today: renderToday,
  water: renderWater,
  history: renderHistory,
  dashboard: renderDashboard,
  stats: renderStats,
  settings: renderSettings,
};

let mainEl: HTMLElement;
let dateBtn: HTMLButtonElement;
let lastTab: Tab | null = null;

const newId = (prefix: string): string =>
  `${prefix}-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`}`;

// ---------------------------------------------------------------- shell

export function mountApp(root: HTMLElement): void {
  root.innerHTML = `
    <img class="edge-mark" src="${markUrl}" alt="" aria-hidden="true" />
    <header class="appbar">
      <div class="appbar__inner">
        <div class="brand">
          <img class="brand__mark" src="${markUrl}" alt="" />
          <div>
            <div class="brand__name">مکتب</div>
            <span class="brand__sub">مدرسه فکری رفتار و انضباط</span>
          </div>
        </div>
        <button class="appbar__date" id="date-btn" data-action="open-picker" aria-haspopup="dialog"></button>
        <button class="icon-btn" data-action="tab" data-tab="settings" aria-label="تنظیمات">${icons.gear}</button>
      </div>
    </header>
    <main class="main" id="main" tabindex="-1"></main>
    <nav class="nav" aria-label="بخش‌ها">
      <div class="nav__inner">
        ${NAV.map(
          (n) => `<button class="nav__btn" data-action="tab" data-tab="${n.tab}">${icons[n.icon]}<span>${n.label}</span></button>`,
        ).join('')}
      </div>
    </nav>`;
  mountOverlays(root);
  mainEl = root.querySelector<HTMLElement>('#main')!;
  dateBtn = root.querySelector<HTMLButtonElement>('#date-btn')!;

  document.addEventListener('click', onClick);
  document.addEventListener('submit', onSubmit);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onChange);
  document.addEventListener('focusout', onFocusOut);

  store.onSaveError = (reason) => {
    if (store.saveErrorShown) return;
    store.saveErrorShown = true;
    toast(reason === 'quota' ? 'فضای ذخیره‌سازی مرورگر پر است؛ تغییرات ذخیره نشد.' : 'ذخیره‌سازی در این مرورگر ممکن نیست.', 6000);
  };
  store.subscribe(render);
  // Background state changes (sync, reminders) re-render only when it can't disturb typing.
  const softRender = (): void => {
    const el = document.activeElement;
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) return;
    render();
  };
  onReminderState(softRender);
  onSyncState(() => {
    if (store.ui.tab === 'settings') softRender();
  });
  render();
  if (!store.persistent) {
    toast('ذخیره‌سازی در این مرورگر غیرفعال است؛ داده‌ها پس از بستن اپ از بین می‌روند.', 7000);
  }
  if (store.recoveredFromCorruption) {
    toast('داده‌های ذخیره‌شده قابل خواندن نبود؛ یک نسخه کنار گذاشته شد و اپ از نو شروع شد.', 7000);
  }

  // Midnight rollover while the app stays open.
  window.setInterval(() => store.checkDayRollover(), 60_000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') store.checkDayRollover();
  });
}

function render(): void {
  const { tab, activeDay, viewMonth } = store.ui;
  const focusKey = (document.activeElement as HTMLElement | null)?.dataset?.key;

  const dayTab = tab === 'today' || tab === 'water';
  const shownDay = tab === 'settings' ? store.today : activeDay;
  // Same-year days drop the year to keep the header on one line on small phones.
  const dayLabel = toJalali(shownDay).jy === toJalali(store.today).jy ? formatLongNoYear(shownDay) : formatLong(shownDay);
  dateBtn.innerHTML = `${esc(dayTab || tab === 'settings' ? dayLabel : formatMonth(viewMonth))}${icons.chevronDown}`;
  dateBtn.setAttribute('aria-label', `انتخاب تاریخ — ${dateBtn.textContent ?? ''}`);
  for (const btn of document.querySelectorAll<HTMLElement>('.nav__btn')) {
    if (btn.dataset.tab === tab) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  }

  mainEl.innerHTML = SCREENS[tab]();
  if (tab !== lastTab) {
    window.scrollTo({ top: 0 });
    lastTab = tab;
  }
  if (focusKey) mainEl.querySelector<HTMLElement>(`[data-key="${CSS.escape(focusKey)}"]`)?.focus({ preventScroll: true });
}

// ---------------------------------------------------------------- events

type Handler = (el: HTMLElement) => void | Promise<void>;

const actions: Record<string, Handler> = {
  tab: (el) => {
    const tab = el.dataset.tab as Tab;
    closeSheet();
    store.setUi({ tab, editTasks: false, editContainers: false, chartDay: null });
  },
  'go-today': () => store.setUi({ activeDay: store.today, viewMonth: monthOf(store.today) }),
  'set-status': (el) => {
    const taskId = el.dataset.task!;
    const status = el.dataset.status as Status;
    const pressed = el.getAttribute('aria-pressed') === 'true';
    // Tapping the active state again clears it (back to "not recorded" / automatic).
    store.mutate((d) => setTaskStatus(d, store.ui.activeDay, taskId, pressed ? null : status));
  },
  water: (el) => {
    const delta = el.dataset.delta === '1' ? 1 : -1;
    store.mutate((d) => adjustWater(d, store.ui.activeDay, el.dataset.id!, delta));
  },
  'toggle-edit-tasks': () => store.setUi({ editTasks: !store.ui.editTasks }),
  'toggle-edit-containers': () => store.setUi({ editContainers: !store.ui.editContainers }),
  'move-task': (el) => store.mutate((d) => moveTask(d, el.dataset.task!, el.dataset.dir === '1' ? 1 : -1)),
  'add-task': (el) => openTaskSheet(null, el.dataset.category as CategoryId),
  'edit-task': (el) => openTaskSheet(el.dataset.task!, null),
  'delete-task': async (el) => {
    const id = el.dataset.task!;
    const task = store.data.tasks.find((t) => t.id === id);
    if (!task) return;
    const ok = await confirmSheet(
      'حذف تسک',
      `«${task.name}» و همه‌ی سابقه‌ی ثبت‌شده‌اش پاک می‌شود و امتیاز روزهای گذشته دوباره حساب می‌شود. این کار برگشت‌پذیر نیست.`,
      'حذف کن',
      true,
    );
    if (!ok) return;
    store.mutate((d) => deleteTask(d, id));
    toast('تسک حذف شد.');
  },
  'add-container': () => openContainerSheet(),
  'delete-container': async (el) => {
    const c = store.data.containers.find((x) => x.id === el.dataset.id);
    if (!c) return;
    const ok = await confirmSheet('حذف ظرف', `«${c.name}» از فهرست حذف می‌شود. آب‌هایی که قبلاً با آن ثبت شده سر جایشان می‌مانند.`, 'حذف کن', true);
    if (ok) store.mutate((d) => deleteContainer(d, c.id));
  },
  month: (el) => store.setUi({ viewMonth: shiftMonth(store.ui.viewMonth, Number(el.dataset.delta)), chartDay: null }),
  'open-day': (el) => {
    const day = el.dataset.day as DayKey;
    if (day > store.today) return;
    store.setUi({ tab: 'today', activeDay: day, editTasks: false });
  },
  'chart-point': (el) => {
    const day = el.dataset.day!;
    store.setUi({ chartDay: store.ui.chartDay === day ? null : day });
  },
  'open-picker': () => openPicker(),
  'picker-month': (el) => {
    const delta = Number(el.dataset.delta);
    store.setUi({ viewMonth: shiftMonth(store.ui.viewMonth, delta), chartDay: null });
    updateSheet(pickerBody());
  },
  'picker-day': (el) => {
    const day = el.dataset.day as DayKey;
    if (day > store.today) return;
    closeSheet();
    store.setUi({ tab: store.ui.tab === 'water' ? 'water' : 'today', activeDay: day, viewMonth: monthOf(day), editTasks: false });
  },
  'picker-today': () => {
    closeSheet();
    store.setUi({ activeDay: store.today, viewMonth: monthOf(store.today) });
  },
  'sheet-close': () => closeSheet(),
  'enable-reminders': async (el) => {
    (el as HTMLButtonElement).disabled = true;
    const error = await enableReminders();
    (el as HTMLButtonElement).disabled = false;
    if (error) toast(error, 6000);
    else {
      dismissReminderBanner();
      toast('یادآوری شبانه روشن شد: هر شب ساعت ۲۱:۳۰.', 4000);
    }
    render();
  },
  'disable-reminders': async () => {
    await disableReminders();
    toast('یادآوری شبانه خاموش شد.');
    render();
  },
  'test-reminder': async (el) => {
    (el as HTMLButtonElement).disabled = true;
    try {
      const sent = await testReminder();
      toast(sent > 0 ? 'اعلان آزمایشی فرستاده شد.' : 'اعلانی فرستاده نشد؛ یادآوری را یک بار خاموش و روشن کن.', 4000);
    } catch (err) {
      toast(err instanceof Error && err.message !== 'offline' ? err.message : 'اتصال اینترنت برقرار نیست.', 4000);
    }
    (el as HTMLButtonElement).disabled = false;
  },
  'dismiss-reminder-banner': () => {
    dismissReminderBanner();
    render();
  },
  'install-app': async () => {
    await promptInstall();
    render();
  },
  logout: async () => {
    const ok = await confirmSheet(
      'خروج از حساب',
      'داده‌هایت روی حساب می‌ماند و با ورود دوباره برمی‌گردد. یادآوری شبانه روی این گوشی خاموش می‌شود.',
      'خروج',
      true,
    );
    if (!ok) return;
    toast('در حال خروج…');
    await flush().catch(() => undefined);
    if (hasUnsentChanges()) {
      toast('بعضی تغییرات هنوز به سرور نرسیده. به اینترنت وصل شو و دوباره خروج را بزن.', 6000);
      return;
    }
    await disableReminders().catch(() => undefined);
    await api('POST', 'logout', {}).catch(() => undefined);
    clearDevice();
    window.location.reload();
  },
  'export-backup': () => exportBackup(),
  'import-backup': () => document.querySelector<HTMLInputElement>('#backup-file')?.click(),
};

function onClick(e: MouseEvent): void {
  const target = e.target as Element;
  const el = target.closest<HTMLElement>('[data-action]');
  if (!el || (el as HTMLButtonElement).disabled) return;
  const handler = actions[el.dataset.action!];
  if (!handler) return;
  e.preventDefault();
  void handler(el);
}

function onInput(e: Event): void {
  const el = e.target as HTMLElement;
  if (el instanceof HTMLTextAreaElement && el.dataset.input === 'journal') {
    // Save on every keystroke without re-rendering (keeps focus and caret).
    store.mutate((d) => setJournal(d, store.ui.activeDay, el.value), { render: false });
    const counter = document.querySelector('#journal-count');
    if (counter) counter.textContent = `${el.value.length} / ${LIMITS.journal}`;
  }
}

/** Re-render after leaving the journal so the auto-completed task and score update. */
function onFocusOut(e: FocusEvent): void {
  const el = e.target as HTMLElement;
  if (el instanceof HTMLTextAreaElement && el.dataset.input === 'journal' && !isSheetOpen()) {
    const next = e.relatedTarget as HTMLElement | null;
    // Let a click on another control proceed first; it re-renders anyway.
    if (next?.closest('[data-action]')) return;
    store.setUi({});
  }
}

function onChange(e: Event): void {
  const el = e.target as HTMLElement;
  if (el instanceof HTMLInputElement && el.id === 'backup-file' && el.files?.[0]) {
    void importBackup(el.files[0]);
    el.value = '';
  }
}

function onSubmit(e: SubmitEvent): void {
  const form = e.target as HTMLFormElement;
  const kind = form.dataset.form;
  if (!kind) return;
  e.preventDefault();
  const fd = new FormData(form);
  const val = (name: string): string => String(fd.get(name) ?? '');
  const showError = (msg: string): void => {
    const box = form.querySelector('[data-error]');
    if (box) box.textContent = msg;
  };

  if (kind === 'goal') {
    const r = validateGoal(val('full'), val('partial'));
    if (!r.ok) return showError(r.error);
    store.mutate((d) => {
      d.waterGoal = r.value;
    });
    toast('هدف آب ذخیره شد.');
    return;
  }

  if (kind === 'task') {
    const r = validateTaskInput({ name: val('name'), note: val('note'), category: val('category') });
    if (!r.ok) return showError(r.error);
    const id = form.dataset.id;
    if (id) store.mutate((d) => updateTask(d, id, r.value));
    else store.mutate((d) => addTask(d, newId('t'), r.value, todayKey()));
    closeSheet();
    toast(id ? 'تسک ذخیره شد.' : 'تسک اضافه شد.');
    return;
  }

  if (kind === 'container') {
    const r = validateContainer(val('name'), val('ml'));
    if (!r.ok) return showError(r.error);
    store.mutate((d) => addContainer(d, { id: newId('c'), ...r.value }));
    closeSheet();
    toast('ظرف اضافه شد.');
  }
}

// ---------------------------------------------------------------- sheets

function openTaskSheet(taskId: string | null, category: CategoryId | null): void {
  const task = taskId ? store.data.tasks.find((t) => t.id === taskId) : undefined;
  const cat = task?.category ?? category ?? 'morning';
  const linkNote =
    task?.link === 'water'
      ? '<p class="small muted">وضعیت این تسک خودکار از آب‌سنج محاسبه می‌شود.</p>'
      : task?.link === 'journal'
        ? '<p class="small muted">این تسک با نوشتن ژورنال خودکار کامل می‌شود.</p>'
        : '';
  openSheet(
    task ? 'ویرایش تسک' : 'تسک تازه',
    `<form data-form="task" ${task ? `data-id="${esc(task.id)}"` : ''} novalidate>
       <label class="field">
         <span class="field__label">نام تسک</span>
         <input class="input" name="name" maxlength="${LIMITS.taskName}" value="${esc(task?.name ?? '')}" autocomplete="off" required />
       </label>
       <label class="field">
         <span class="field__label">توضیح کوتاه (اختیاری)</span>
         <input class="input" name="note" maxlength="${LIMITS.taskNote}" value="${esc(task?.note ?? '')}" autocomplete="off" />
       </label>
       <label class="field">
         <span class="field__label">دسته</span>
         <select class="select" name="category">
           ${CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === cat ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}
         </select>
       </label>
       ${linkNote}
       ${task ? '' : '<p class="small muted">تسک تازه از امروز حساب می‌شود و امتیاز روزهای گذشته را تغییر نمی‌دهد.</p>'}
       <div class="error" data-error></div>
       <button class="btn btn--primary btn--block" type="submit">${task ? 'ذخیره' : 'افزودن'}</button>
       ${task ? `<button class="btn btn--danger btn--block" type="button" style="margin-top:10px" data-action="delete-task" data-task="${esc(task.id)}">${icons.trash.replace('<svg', '<svg width="18" height="18"')} حذف تسک</button>` : ''}
     </form>`,
  );
}

function openContainerSheet(): void {
  openSheet(
    'ظرف تازه',
    `<form data-form="container" novalidate>
       <label class="field">
         <span class="field__label">نام ظرف</span>
         <input class="input" name="name" maxlength="${LIMITS.containerName}" autocomplete="off" placeholder="مثلاً قمقمه‌ی باشگاه" />
       </label>
       <label class="field">
         <span class="field__label">حجم (میلی‌لیتر)</span>
         <input class="input input--ltr" name="ml" inputmode="numeric" autocomplete="off" placeholder="750" />
       </label>
       <div class="error" data-error></div>
       <button class="btn btn--primary btn--block" type="submit">افزودن</button>
     </form>`,
  );
}

function pickerBody(): string {
  const month = store.ui.viewMonth;
  return `${monthNav(month, 'picker-month')}
    ${monthGrid(month, { selected: store.ui.activeDay, action: 'picker-day' })}
    <div class="legend" style="justify-content:space-between">
      <span>روزهای آینده بسته‌اند.</span>
    </div>
    <button class="btn btn--ghost btn--block" style="margin-top:14px" data-action="picker-today">امروز</button>`;
}

function openPicker(): void {
  const { tab, activeDay } = store.ui;
  // On day screens, open the picker on the month of the day being shown.
  if (tab === 'today' || tab === 'water' || tab === 'settings') store.setUi({ viewMonth: monthOf(activeDay) });
  openSheet('انتخاب روز', pickerBody());
}

// ---------------------------------------------------------------- backup

function exportBackup(): void {
  const blob = new Blob([serializeBackup(store.data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `maktab-backup-${todayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  toast('فایل پشتیبان آماده‌ی دانلود شد.');
}

async function importBackup(file: File): Promise<void> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    toast('خواندن فایل ممکن نشد.');
    return;
  }
  const result = parseBackup(text);
  if (!result.ok) {
    toast(result.error, 4000);
    return;
  }
  const days = Object.keys(result.data.days).length;
  const ok = await confirmSheet(
    'بازیابی پشتیبان',
    `همه‌ی داده‌های فعلی این گوشی با فایل پشتیبان (${days} روز ثبت‌شده) جایگزین می‌شود.`,
    'جایگزین کن',
    true,
  );
  if (!ok) return;
  store.replaceData(result.data);
  toast('پشتیبان بازیابی شد.');
}
