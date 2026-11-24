import './styles/main.css';
import type { User } from './net/api';
import { adoptAccount, loadAuth, startSync } from './net/sync';
import { disableReminders, refreshReminders, watchInstallPrompt } from './pwa/push';
import { registerServiceWorker } from './pwa/register';
import { mountApp } from './ui/app';
import { mountAuth } from './ui/auth';
import { store } from './ui/store';

function safeLocalStorage(): Storage | null {
  try {
    const probe = '__maktab_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

const root = document.getElementById('app')!;
const storage = safeLocalStorage();
store.init(storage);

/** Session ended on the server (expired, password reset): sign in again, keeping unsent local changes. */
function signedOut(): void {
  void disableReminders().catch(() => undefined);
  try {
    localStorage.removeItem('maktab.auth.v1');
  } catch {
    /* ignore */
  }
  window.location.reload();
}

function start(user: User, el: HTMLElement): void {
  store.user = user;
  mountApp(el);
  startSync({ onUnauthorized: signedOut });
  void refreshReminders().then(() => store.setUi({}));
}

watchInstallPrompt(() => store.setUi({}));

const SERVER_KEY = 'maktab.server.v1';

/**
 * Is the app served by its own server (accounts, sync, reminders)?
 * On a static host such as GitHub Pages there is no /api, and the app runs in
 * local mode: no sign-in, data stays on this phone (the original behaviour).
 * Once a server answered, that is remembered so offline launches still show sign-in.
 */
async function hasServer(): Promise<boolean> {
  if (location.hostname.endsWith('github.io')) return false;
  try {
    if (localStorage.getItem(SERVER_KEY) === '1') return true;
  } catch {
    /* ignore */
  }
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 5000);
    const res = await fetch('./api/push/key', { signal: controller.signal, headers: { Accept: 'application/json' } });
    window.clearTimeout(timer);
    const body = (await res.json().catch(() => null)) as { publicKey?: unknown } | null;
    const ok = res.ok && typeof body?.publicKey === 'string';
    if (ok) localStorage.setItem(SERVER_KEY, '1');
    return ok;
  } catch {
    return false;
  }
}

const user = loadAuth();
if (user) {
  start(user, root);
} else {
  void hasServer().then((server) => {
    store.serverMode = server;
    if (!server) {
      mountApp(root); // local mode
      return;
    }
    mountAuth(root, (u) => {
      adoptAccount(u);
      // Fresh node for the app, so the sign-in screen's listeners go away with the old one.
      const fresh = root.cloneNode(false) as HTMLElement;
      root.replaceWith(fresh);
      start(u, fresh);
    });
  });
}

if (import.meta.env.PROD) registerServiceWorker();

// Ask the browser not to evict our data under storage pressure (best effort, no prompt on Android Chrome).
void navigator.storage?.persist?.().catch(() => undefined);
