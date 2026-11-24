import markUrl from '../assets/brand/mark-color-on-dark.svg';
import { api, ApiError, OfflineError, timeZone, type User } from '../net/api';
import { esc } from './html';

type Mode = 'signup' | 'login';

/**
 * Sign-up / sign-in screen shown before the app when nobody is signed in on
 * this device. Resolves once the server accepted the account.
 */
export function mountAuth(root: HTMLElement, onDone: (user: User) => void): void {
  let mode: Mode = 'signup';
  let busy = false;

  const field = (name: string, label: string, attrs: string, cls = 'input'): string => `
    <label class="field">
      <span class="field__label">${esc(label)}</span>
      <input class="${cls}" name="${name}" ${attrs} />
    </label>`;

  const render = (error = '', values: Record<string, string> = {}): void => {
    const v = (k: string): string => esc(values[k] ?? '');
    root.innerHTML = `
      <img class="edge-mark" src="${markUrl}" alt="" aria-hidden="true" />
      <main class="auth" id="main">
        <div class="auth__brand">
          <img class="auth__mark" src="${markUrl}" alt="" />
          <div class="brand__name">مکتب</div>
          <span class="brand__sub">مدرسه فکری رفتار و انضباط</span>
        </div>
        <div>
          <div class="label">${mode === 'signup' ? 'SIGN UP' : 'SIGN IN'}</div>
          <h1 class="title">${mode === 'signup' ? 'ساخت حساب' : 'ورود به حساب'}</h1>
          <p class="small muted" style="margin:6px 0 0">${
            mode === 'signup'
              ? 'برای استفاده از ردیاب عادت مکتب یک حساب بساز. با همین شماره و رمز روی هر گوشی وارد می‌شوی و داده‌هایت همراهت می‌ماند.'
              : 'با شماره همراه و رمز عبوری که موقع ثبت‌نام گذاشتی وارد شو.'
          }</p>
        </div>
        <div class="segmented" role="tablist" aria-label="ورود یا ثبت‌نام">
          <button type="button" role="tab" data-mode="signup" aria-selected="${mode === 'signup'}">ثبت‌نام</button>
          <button type="button" role="tab" data-mode="login" aria-selected="${mode === 'login'}">ورود</button>
        </div>
        <form class="panel panel__body" data-auth="${mode}" novalidate>
          ${mode === 'signup' ? field('name', 'نام و نام خانوادگی', `autocomplete="name" maxlength="60" required value="${v('name')}"`) : ''}
          ${field('phone', 'شماره همراه', `type="tel" inputmode="tel" autocomplete="tel" placeholder="09121234567" maxlength="20" required value="${v('phone')}"`, 'input input--ltr')}
          <label class="field">
            <span class="field__label">رمز عبور</span>
            <span class="pass">
              <input class="input input--ltr" name="password" type="password" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}"
                minlength="6" maxlength="128" required />
              <button type="button" class="pass__toggle" data-toggle-pass aria-label="نمایش رمز">نمایش</button>
            </span>
            ${mode === 'signup' ? '<span class="task__note">دست‌کم ۶ کاراکتر</span>' : ''}
          </label>
          <div class="error" role="alert" data-error>${esc(error)}</div>
          <button class="btn btn--primary btn--block" type="submit" ${busy ? 'disabled' : ''}>
            ${busy ? 'لطفاً صبر کن…' : mode === 'signup' ? 'ساخت حساب و ورود' : 'ورود'}
          </button>
        </form>
        <p class="small muted" style="text-align:center">${
          mode === 'signup'
            ? 'قبلاً حساب ساخته‌ای؟ <button type="button" class="link" data-mode="login">وارد شو</button>'
            : 'حساب نداری؟ <button type="button" class="link" data-mode="signup">ثبت‌نام کن</button><br/>رمز را فراموش کرده‌ای؟ به پشتیبانی مکتب پیام بده تا رمز تازه بگیری.'
        }</p>
      </main>`;
    const first = root.querySelector<HTMLInputElement>('form input');
    if (!error) first?.focus({ preventScroll: true });
  };

  root.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const modeBtn = target.closest<HTMLElement>('[data-mode]');
    if (modeBtn && !busy) {
      const form = root.querySelector('form');
      const values = form ? Object.fromEntries([...new FormData(form)].map(([k, val]) => [k, String(val)])) : {};
      delete values.password;
      mode = modeBtn.dataset.mode as Mode;
      render('', values);
      return;
    }
    const toggle = target.closest<HTMLButtonElement>('[data-toggle-pass]');
    if (toggle) {
      const input = toggle.parentElement!.querySelector('input')!;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      toggle.textContent = show ? 'پنهان' : 'نمایش';
      toggle.setAttribute('aria-label', show ? 'پنهان کردن رمز' : 'نمایش رمز');
    }
  });

  root.addEventListener('submit', (e) => {
    const form = (e.target as HTMLElement).closest<HTMLFormElement>('form[data-auth]');
    if (!form) return;
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(form);
    const values = Object.fromEntries([...fd].map(([k, val]) => [k, String(val)]));
    const errorBox = form.querySelector('[data-error]')!;
    // Quick client-side checks; the server re-validates everything.
    if (mode === 'signup' && (values.name ?? '').trim().length < 3) return void (errorBox.textContent = 'نام و نام خانوادگی را کامل بنویس.');
    if (!(values.phone ?? '').trim()) return void (errorBox.textContent = 'شماره همراه را بنویس.');
    if ((values.password ?? '').length < 6) return void (errorBox.textContent = 'رمز عبور دست‌کم ۶ کاراکتر باشد.');

    busy = true;
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    submit.disabled = true;
    submit.textContent = 'لطفاً صبر کن…';
    const body = mode === 'signup' ? { name: values.name, phone: values.phone, password: values.password, tz: timeZone() } : { phone: values.phone, password: values.password, tz: timeZone() };
    api<{ user: User }>('POST', mode, body)
      .then((res) => {
        busy = false;
        onDone(res.user);
      })
      .catch((err: unknown) => {
        busy = false;
        const message =
          err instanceof OfflineError
            ? 'اتصال اینترنت برقرار نیست. برای ورود اول، اینترنت لازم است.'
            : err instanceof ApiError
              ? err.message
              : 'خطای ناشناخته؛ دوباره امتحان کن.';
        delete values.password;
        render(message, values);
        // After an "already registered" answer, switch to sign-in with the phone filled in.
        if (err instanceof ApiError && err.status === 409) {
          mode = 'login';
          render(message, values);
        }
      });
  });

  render();
}
