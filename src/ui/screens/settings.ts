import { syncState, type SyncState } from '../../net/sync';
import { canInstall, isIos, isStandalone, reminderState, type ReminderState } from '../../pwa/push';
import { esc } from '../html';
import { icons } from '../icons';
import { store } from '../store';

export const APP_VERSION = __APP_VERSION__;
const CONTACT_EMAIL = 'bardia.bkhaledi@gmail.com';

const toLitres = (ml: number): string => String(Number((ml / 1000).toFixed(2)));
const btnIcon = (svg: string): string => svg.replace('<svg', '<svg width="18" height="18"');

const SYNC_LABEL: Record<SyncState, string> = {
  synced: 'همه‌ی داده‌ها روی حساب ذخیره شده است.',
  pending: 'در حال ذخیره روی حساب…',
  offline: 'آفلاین — تغییرات روی گوشی ذخیره شده و با وصل شدن اینترنت ارسال می‌شود.',
  error: 'ارسال به سرور ممکن نشد؛ دوباره تلاش می‌کنیم. داده‌ها روی گوشی امن است.',
};

function accountSection(): string {
  const user = store.user;
  if (!user) return '';
  const state = syncState();
  return `<section class="panel" aria-labelledby="account-title">
      <div class="panel__head"><div><div class="label">ACCOUNT</div><h2 class="panel__title" id="account-title">حساب کاربری</h2></div></div>
      <div class="panel__body">
        <div class="task__name">${esc(user.name)}</div>
        <div class="small muted num" dir="ltr" style="text-align:right">${esc(user.phone)}</div>
        <p class="small ${state === 'synced' || state === 'pending' ? 'muted' : 'tone-low'}" style="margin:12px 0 14px" aria-live="polite">${esc(SYNC_LABEL[state])}</p>
        <button class="btn btn--ghost btn--block" data-action="logout">${btnIcon(icons.logout)} خروج از حساب</button>
      </div>
    </section>`;
}

function reminderBody(state: ReminderState): string {
  switch (state) {
    case 'on':
      return `<p class="small muted" style="margin:0 0 14px">روشن است. هر شب ساعت <span class="num">21:30</span> اگر کاری از امروز مانده باشد، نامش را در اعلان می‌بینی.</p>
        <div class="btn-row">
          <button class="btn btn--ghost" data-action="test-reminder">اعلان آزمایشی</button>
          <button class="btn btn--ghost" data-action="disable-reminders">خاموش کن</button>
        </div>`;
    case 'off':
    case 'unknown':
      return `<p class="small muted" style="margin:0 0 14px">هر شب ساعت <span class="num">21:30</span> کارهای ناتمام امروز را با نام در یک اعلان یادآوری می‌کنیم.</p>
        <button class="btn btn--primary btn--block" data-action="enable-reminders">${btnIcon(icons.bell)} روشن کردن یادآوری</button>`;
    case 'denied':
      return '<p class="small muted" style="margin:0">اعلان‌های مکتب در این مرورگر مسدود شده است. از تنظیمات گوشی یا مرورگر (بخش Notifications سایت) اجازه بده و اپ را دوباره باز کن.</p>';
    case 'needs-install':
      return '<p class="small muted" style="margin:0">در آیفون اعلان فقط برای اپ نصب‌شده کار می‌کند: در Safari دکمه‌ی Share و بعد <span dir="ltr">Add to Home Screen</span> را بزن، اپ را از آیکن صفحه‌ی اصلی باز کن و این‌جا یادآوری را روشن کن.</p>';
    default:
      return '<p class="small muted" style="margin:0">این مرورگر از اعلان پشتیبانی نمی‌کند. اپ را در Chrome (اندروید) یا Safari (آیفون) نصب کن.</p>';
  }
}

function installSection(): string {
  if (isStandalone()) return '';
  let body: string;
  if (canInstall()) {
    body = `<button class="btn btn--primary btn--block" data-action="install-app">${btnIcon(icons.download)} نصب اپ روی گوشی</button>`;
  } else if (isIos()) {
    body = '<p class="small muted" style="margin:0">در Safari دکمه‌ی Share و بعد <span dir="ltr">Add to Home Screen</span> را بزن.</p>';
  } else {
    body = '<p class="small muted" style="margin:0">از منوی مرورگر گزینه‌ی «نصب برنامه» یا «Add to Home screen» را بزن.</p>';
  }
  return `<section class="panel" aria-labelledby="install-title">
      <div class="panel__head"><h2 class="panel__title" id="install-title">نصب اپ</h2></div>
      <div class="panel__body">${body}</div>
    </section>`;
}

export function renderSettings(): string {
  const { waterGoal } = store.data;
  return `<div class="stack">
      <div>
        <div class="label">SETTINGS</div>
        <h1 class="title">تنظیمات</h1>
      </div>

      ${accountSection()}

      <section class="panel" aria-labelledby="reminder-title">
        <div class="panel__head"><div><div class="label">REMINDER</div><h2 class="panel__title" id="reminder-title">یادآوری شبانه</h2></div></div>
        <div class="panel__body">${reminderBody(reminderState())}</div>
      </section>

      ${installSection()}

      <section class="panel" aria-labelledby="goal-title">
        <div class="panel__head"><h2 class="panel__title" id="goal-title">هدف آب روزانه</h2></div>
        <form class="panel__body" data-form="goal" novalidate>
          <label class="field">
            <span class="field__label">«کامل» از (لیتر)</span>
            <input class="input input--ltr" name="full" inputmode="decimal" value="${esc(toLitres(waterGoal.fullMl))}" autocomplete="off" />
          </label>
          <label class="field">
            <span class="field__label">«ناقص» از (لیتر)</span>
            <input class="input input--ltr" name="partial" inputmode="decimal" value="${esc(toLitres(waterGoal.partialMl))}" autocomplete="off" />
          </label>
          <div class="error" data-error></div>
          <button class="btn btn--primary btn--block" type="submit">ذخیره‌ی هدف</button>
          <p class="small muted" style="margin:10px 0 0">هدف جدید از امروز اعمال می‌شود؛ روزهایی که قبلاً آب ثبت کرده‌اند تغییر نمی‌کنند.</p>
        </form>
      </section>

      <section class="panel" aria-labelledby="backup-title">
        <div class="panel__head"><h2 class="panel__title" id="backup-title">پشتیبان‌گیری</h2></div>
        <div class="panel__body">
          <p class="small muted" style="margin:0 0 14px">داده‌هایت روی حساب تو ذخیره می‌شود و با ورود روی هر گوشی برمی‌گردد. برای اطمینان بیشتر می‌توانی یک فایل پشتیبان هم نگه داری.</p>
          <div class="btn-row">
            <button class="btn btn--ghost" data-action="export-backup">${btnIcon(icons.download)} دریافت فایل</button>
            <button class="btn btn--ghost" data-action="import-backup">${btnIcon(icons.upload)} بازیابی</button>
          </div>
          <input type="file" accept="application/json,.json" id="backup-file" hidden />
        </div>
      </section>

      <p class="small muted" style="text-align:center">نسخه‌ی <span class="num">${esc(APP_VERSION)}</span></p>

      <p class="fine-print"><a href="mailto:${CONTACT_EMAIL}">ارتباط با سازنده · <span class="num">${CONTACT_EMAIL}</span></a></p>
    </div>`;
}
