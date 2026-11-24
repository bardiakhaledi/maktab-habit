import { getRecord } from '../../domain/records';
import { goalForDay, waterStatus, waterTotalMl } from '../../domain/water';
import { esc, litres } from '../html';
import { icons } from '../icons';
import { store } from '../store';
import { pastDayBanner } from './today';

const STATUS_TEXT = { done: 'کامل', partial: 'ناقص', missed: 'هنوز به هدف نرسیده' } as const;

export function renderWater(): string {
  const { activeDay, editContainers } = store.ui;
  const rec = getRecord(store.data, activeDay);
  const total = waterTotalMl(rec);
  const goal = goalForDay(store.data, activeDay);
  const status = waterStatus(total, goal);
  const fill = Math.min(1, total / goal.fullMl);

  const containerRows = store.data.containers
    .map((c) => {
      const count = rec.water[c.id]?.count ?? 0;
      const control = editContainers
        ? `<button class="icon-btn" style="border:1px solid var(--line)" data-action="delete-container" data-id="${esc(c.id)}"
             aria-label="حذف ${esc(c.name)}">${icons.trash}</button>`
        : `<div class="stepper">
             <button class="stepper__btn" data-action="water" data-id="${esc(c.id)}" data-delta="-1" data-key="w-${esc(c.id)}-minus"
               aria-label="کم کردن ${esc(c.name)}" ${count === 0 ? 'disabled' : ''}>−</button>
             <span class="stepper__count num" aria-live="polite">${count}</span>
             <button class="stepper__btn stepper__btn--plus" data-action="water" data-id="${esc(c.id)}" data-delta="1" data-key="w-${esc(c.id)}-plus"
               aria-label="افزودن ${esc(c.name)}">+</button>
           </div>`;
      return `<div class="container-row">
          <div class="task__text">
            <div class="task__name">${esc(c.name)}</div>
            <span class="task__note num">${c.ml} ml</span>
          </div>
          ${control}
        </div>`;
    })
    .join('');

  // Servings logged with containers that were deleted afterwards: can only be removed.
  const known = new Set(store.data.containers.map((c) => c.id));
  const orphanRows = Object.entries(rec.water)
    .filter(([id]) => !known.has(id))
    .map(
      ([id, e]) => `<div class="container-row">
          <div class="task__text">
            <div class="task__name">${esc(e.name)} <span class="small muted">(حذف‌شده)</span></div>
            <span class="task__note num">${e.ml} ml</span>
          </div>
          <div class="stepper">
            <button class="stepper__btn" data-action="water" data-id="${esc(id)}" data-delta="-1" aria-label="کم کردن ${esc(e.name)}">−</button>
            <span class="stepper__count num">${e.count}</span>
          </div>
        </div>`,
    )
    .join('');

  return `<div class="stack">
      ${pastDayBanner()}
      <section class="panel water-total" aria-label="مجموع آب">
        <div class="label">WATER</div>
        <div class="water-total__value num">${litres(total)}<span class="water-total__unit"> L</span></div>
        <div class="water-goal" aria-hidden="true"><span style="width:${(fill * 100).toFixed(1)}%"></span></div>
        <div class="small"><span class="${status === 'done' ? 'tone-top' : status === 'partial' ? 'tone-great' : 'muted'}">${STATUS_TEXT[status]}</span></div>
        <div class="small muted">هدف کامل <span class="num">${litres(goal.fullMl)} L</span> · ناقص از <span class="num">${litres(goal.partialMl)} L</span></div>
      </section>

      <section class="panel" aria-labelledby="containers-title">
        <div class="panel__head">
          <div>
            <div class="label">CONTAINERS</div>
            <h2 class="panel__title" id="containers-title">ظرف‌ها</h2>
          </div>
          <button class="btn btn--ghost" style="min-height:36px;padding:6px 12px" data-action="toggle-edit-containers">
            ${editContainers ? 'پایان' : 'ویرایش'}
          </button>
        </div>
        ${containerRows || '<div class="empty">ظرفی تعریف نشده است.</div>'}
        ${orphanRows}
        ${editContainers ? `<button class="add-row" data-action="add-container">${icons.plus.replace('<svg', '<svg width="16" height="16"')} افزودن ظرف</button>` : ''}
      </section>
      <button class="btn btn--ghost btn--block" data-action="tab" data-tab="settings">تغییر هدف روزانه</button>
    </div>`;
}
