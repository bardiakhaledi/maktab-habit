import { api, timeZone } from '../net/api';

/**
 * Nightly reminder (Web Push). The server sends it at 21:30 in the user's
 * time zone, listing the tasks still open that day.
 */

export type ReminderState = 'unsupported' | 'needs-install' | 'denied' | 'off' | 'on' | 'unknown';

let current: ReminderState = 'unknown';
const listeners: (() => void)[] = [];

export const reminderState = (): ReminderState => current;
export const onReminderState = (l: () => void): void => void listeners.push(l);

function set(next: ReminderState): void {
  if (next === current) return;
  current = next;
  for (const l of listeners) l();
}

export function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

const supported = (): boolean => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

/** Service worker registration, or null if none becomes ready (e.g. dev mode). */
async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  const timeout = new Promise<null>((r) => window.setTimeout(() => r(null), 8000));
  return Promise.race([navigator.serviceWorker.ready, timeout]);
}

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

/** Works out the current state and re-sends an existing subscription so the server always has it. */
export async function refreshReminders(): Promise<void> {
  if (!supported()) {
    // iPhone Safari only offers push once the app is added to the home screen.
    set(isIos() && !isStandalone() ? 'needs-install' : 'unsupported');
    return;
  }
  if (Notification.permission === 'denied') return set('denied');
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription().catch(() => null);
  if (Notification.permission === 'granted' && sub) {
    set('on');
    void api('POST', 'push/subscribe', { subscription: sub.toJSON(), tz: timeZone() }).catch(() => undefined);
  } else {
    set('off');
  }
}

/** Asks for permission (must run from a tap) and registers this device. Returns an error message or null. */
export async function enableReminders(): Promise<string | null> {
  if (!supported()) {
    return isIos() && !isStandalone()
      ? 'در آیفون، اول اپ را با «Add to Home Screen» به صفحه‌ی اصلی اضافه کن و از همان آیکن باز کن.'
      : 'این مرورگر از اعلان پشتیبانی نمی‌کند.';
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    set(permission === 'denied' ? 'denied' : 'off');
    return permission === 'denied' ? 'اجازه‌ی اعلان رد شد. از تنظیمات مرورگر یا گوشی، اعلان مکتب را روشن کن.' : 'اجازه‌ی اعلان داده نشد.';
  }
  const reg = await registration();
  if (!reg) return 'سرویس اعلان آماده نیست؛ صفحه را یک بار ببند و دوباره باز کن.';
  try {
    const { publicKey } = await api<{ publicKey: string }>('GET', 'push/key');
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
    await api('POST', 'push/subscribe', { subscription: sub.toJSON(), tz: timeZone() });
    set('on');
    return null;
  } catch {
    return 'روشن کردن یادآوری ممکن نشد. اتصال اینترنت را بررسی کن و دوباره امتحان کن.';
  }
}

export async function disableReminders(): Promise<void> {
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription().catch(() => null);
  if (sub) {
    await api('POST', 'push/unsubscribe', { endpoint: sub.endpoint }).catch(() => undefined);
    await sub.unsubscribe().catch(() => undefined);
  }
  set('off');
}

export async function testReminder(): Promise<number> {
  const res = await api<{ sent: number }>('POST', 'push/test', {});
  return res.sent;
}

const BANNER_KEY = 'maktab.reminderBanner.dismissed';

/** The "turn on the nightly reminder" banner on the Today screen, until dismissed or done. */
export function reminderBannerDismissed(): boolean {
  try {
    return localStorage.getItem(BANNER_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissReminderBanner(): void {
  try {
    localStorage.setItem(BANNER_KEY, '1');
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------- install prompt (Android / desktop Chrome)

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredInstall: InstallPromptEvent | null = null;

export function watchInstallPrompt(onChange: () => void): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e as InstallPromptEvent;
    onChange();
  });
  window.addEventListener('appinstalled', () => {
    deferredInstall = null;
    onChange();
  });
}

export const canInstall = (): boolean => deferredInstall !== null;

export async function promptInstall(): Promise<void> {
  if (!deferredInstall) return;
  await deferredInstall.prompt();
  await deferredInstall.userChoice.catch(() => undefined);
  deferredInstall = null;
}
