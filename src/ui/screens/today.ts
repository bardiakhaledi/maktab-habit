import { addDays, formatShort } from '../../domain/dates';
import { reminderBannerDismissed, reminderState } from '../../pwa/push';
import { getRecord } from '../../domain/records';
import { dayScore, effectiveStatus, levelFor, tasksForDay } from '../../domain/scoring';
import { tasksInCategory } from '../../domain/tasks';
import type { Status, Task } from '../../domain/types';
import { CATEGORIES, LIMITS } from '../../domain/types';
import { waterTotalMl } from '../../domain/water';
import { esc, litres } from '../html';
import { icons } from '../icons';
import { store } from '../store';

const STATE_LABEL: Record<Status, string> = { done: 'کامل', partial: 'ناقص', missed: 'انجام نشده' };
const STATES: readonly Status[] = ['done', 'partial', 'missed'];

export function pastDayBanner(): string {
  const { activeDay } = store.ui;
  if (activeDay === store.today) return '';
  return `<div class="banner settings-row">
      <span>در حال ثبت برای <strong>${esc(formatShort(activeDay))}</strong></span>
      <button class="btn btn--ghost" style="min-height:36px;padding:6px 12px" data-action="go-today">بازگشت به امروز</button>
    </div>`;
}

function scoreCard(): string {
  const { activeDay } = store.ui;
  const s = dayScore(store.data, activeDay);
  const level = s.pct === null ? null : levelFor(s.pct);
  const fill = s.max === 0 ? 0 : s.score / s.max;
  return `<section class="panel score" aria-label="ارزیابی روز">
      <div>
        <div class="label">DAILY SCORE</div>
        <div class="score__pct num">${s.pct === null ? '—' : `${s.pct}<small>%</small>`}</div>
      </div>
      <div class="score__meta">
        <div class="score__level ${level ? `tone-${level.tone}` : 'muted'}">${level ? esc(level.label) : 'هنوز ثبت نشده'}</div>
        <div class="small muted"><span class="num">${s.score} / ${s.max}</span> امتیاز</div>
      </div>
      <div class="bar" aria-hidden="true"><span style="transform:scaleX(${fill.toFixed(3)})"></span></div>
    </section>`;
}

function statusButtons(task: Task, current: Status | undefined): string {
  return `<div class="states" role="group" aria-label="${esc(task.name)}">
    ${STATES.map(
      (s) => `<button class="state state--${s}" data-action="set-status" data-task="${esc(task.id)}" data-status="${s}"
         data-key="st-${esc(task.id)}-${s}" aria-pressed="${current === s}" aria-label="${STATE_LABEL[s]}">${icons[s]}</button>`,
    ).join('')}
  </div>`;
}

function waterRow(task: Task, status: Status): string {
  const total = waterTotalMl(getRecord(store.data, store.ui.activeDay));
  return `<div class="task">
      <div class="task__text">
        <div class="task__name">${esc(task.name)}</div>
        <span class="task__note">محاسبه‌ی خودکار از آب‌سنج</span>
      </div>
      <button class="chip" data-action="tab" data-tab="water" aria-label="باز کردن آب‌سنج">
        <span class="num">${litres(total)} L</span>
        <span class="state state--${status} state--mini${total > 0 ? ' is-on' : ''}" aria-label="${STATE_LABEL[status]}">${icons[status]}</span>
      </button>
    </div>`;
}

/** Google Calendar's day view for the day after `day` (planning is for tomorrow). */
function calendarUrl(day: string): string {
  const [y, m, d] = addDays(day, 1).split('-');
  return `https://calendar.google.com/calendar/r/day/${y}/${Number(m)}/${Number(d)}`;
}

function calendarLink(): string {
  return `<a class="cal-link" href="${calendarUrl(store.ui.activeDay)}" target="_blank" rel="noopener noreferrer"
      aria-label="برنامه‌ریزی فردا در گوگل کلندر" title="برنامه‌ریزی فردا در گوگل کلندر">${icons.calendar}<span>کلندر</span></a>`;
}

function taskRow(task: Task): string {
  const { activeDay } = store.ui;
  const rec = getRecord(store.data, activeDay);
  const status = effectiveStatus(store.data, task, activeDay, rec);
  if (task.link === 'water') return waterRow(task, status ?? 'missed');
  const auto = task.link === 'journal' && !rec.tasks[task.id] && status === 'done';
  return `<div class="task">
      <div class="task__text">
        <div class="task__name">${esc(task.name)}</div>
        ${auto ? '<span class="task__auto">خودکار از ژورنال</span>' : ''}
        ${task.note ? `<span class="task__note">${esc(task.note)}</span>` : ''}
      </div>
      ${task.id === 't-planning' ? calendarLink() : ''}
      ${statusButtons(task, auto ? undefined : status)}
    </div>`;
}

function editRow(task: Task, index: number, count: number): string {
  return `<div class="task task--edit">
      <button class="task__text" style="text-align:inherit" data-action="edit-task" data-task="${esc(task.id)}">
        <div class="task__name">${esc(task.name)} <span class="muted" style="display:inline-block;width:14px;vertical-align:-2px">${icons.pencil}</span></div>
        ${task.note ? `<span class="task__note">${esc(task.note)}</span>` : ''}
      </button>
      <div class="reorder">
        <button class="icon-btn" data-action="move-task" data-task="${esc(task.id)}" data-dir="-1" data-key="mv-${esc(task.id)}-up"
          aria-label="بالا بردن" ${index === 0 ? 'disabled' : ''}>${icons.up}</button>
        <button class="icon-btn" data-action="move-task" data-task="${esc(task.id)}" data-dir="1" data-key="mv-${esc(task.id)}-down"
          aria-label="پایین آوردن" ${index === count - 1 ? 'disabled' : ''}>${icons.down}</button>
      </div>
    </div>`;
}

function categories(): string {
  const { activeDay, editTasks } = store.ui;
  const visible = new Set(tasksForDay(store.data.tasks, activeDay).map((t) => t.id));
  return CATEGORIES.map((cat) => {
    const all = tasksInCategory(store.data, cat.id);
    const list = editTasks ? all : all.filter((t) => visible.has(t.id));
    const rows = list.length
      ? list.map((t, i) => (editTasks ? editRow(t, i, list.length) : taskRow(t))).join('')
      : '<div class="empty">تسکی در این دسته نیست.</div>';
    return `<section class="panel cat" aria-labelledby="cat-${cat.id}">
        <div class="cat__head">
          <div>
            <div class="label">${cat.index} / ${cat.label}</div>
            <h2 class="cat__name" id="cat-${cat.id}">${esc(cat.title)}</h2>
          </div>
          <span class="cat__count num">${list.length}</span>
        </div>
        ${rows}
        ${editTasks ? `<button class="add-row" data-action="add-task" data-category="${cat.id}">${icons.plus.replace('<svg', '<svg width="16" height="16"')} افزودن تسک</button>` : ''}
      </section>`;
  }).join('');
}

function journal(): string {
  const { activeDay } = store.ui;
  const text = getRecord(store.data, activeDay).journal;
  const isToday = activeDay === store.today;
  return `<section class="panel" aria-labelledby="journal-title">
      <div class="panel__head">
        <div>
          <div class="label">JOURNAL</div>
          <h2 class="panel__title" id="journal-title">ژورنال ${isToday ? 'امروز' : esc(formatShort(activeDay))}</h2>
        </div>
      </div>
      <div class="panel__body">
        <label class="sr-only" for="journal">متن ژورنال</label>
        <textarea class="textarea" id="journal" data-input="journal" data-key="journal" maxlength="${LIMITS.journal}"
          placeholder="امروز بابت چه چیزهایی شکرگزاری؟ چه کارهایی انجام دادی؟">${esc(text)}</textarea>
        <div class="journal__meta">
          <span>ذخیره‌ی خودکار</span>
          <span class="num" id="journal-count">${text.length} / ${LIMITS.journal}</span>
        </div>
      </div>
    </section>`;
}

function reminderBanner(): string {
  const state = reminderState();
  if (store.ui.activeDay !== store.today || reminderBannerDismissed()) return '';
  if (state !== 'off' && state !== 'needs-install') return '';
  const text =
    state === 'off'
      ? 'هر شب ساعت <span class="num">21:30</span> کارهای ناتمام امروز را یادآوری کنیم؟'
      : 'برای یادآوری شبانه در آیفون، اول از دکمه‌ی Share گزینه‌ی <span dir="ltr">Add to Home Screen</span> را بزن و اپ را از همان آیکن باز کن.';
  return `<div class="banner reminder-banner">
      <span>${text}</span>
      <span class="reminder-banner__actions">
        ${state === 'off' ? '<button class="btn btn--primary btn--sm" data-action="enable-reminders">روشن کن</button>' : ''}
        <button class="icon-btn" data-action="dismiss-reminder-banner" aria-label="بستن">${icons.close}</button>
      </span>
    </div>`;
}

export function renderToday(): string {
  const { editTasks } = store.ui;
  return `<div class="stack">
      ${pastDayBanner()}
      ${editTasks ? '' : reminderBanner()}
      ${editTasks ? '<div class="banner">ترتیب، نام و دسته‌ی تسک‌ها را تغییر بده. تغییرات روی همه‌ی روزها اعمال می‌شود.</div>' : scoreCard()}
      ${categories()}
      <button class="btn ${editTasks ? 'btn--primary' : 'btn--ghost'} btn--block" data-action="toggle-edit-tasks" data-key="toggle-edit">
        ${editTasks ? 'پایان ویرایش' : `${icons.pencil.replace('<svg', '<svg width="16" height="16"')} ویرایش تسک‌ها`}
      </button>
      ${editTasks ? '' : journal()}
    </div>`;
}

