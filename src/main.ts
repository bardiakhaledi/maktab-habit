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

const user = loadAuth();
if (user) {
  start(user, root);
} else {
  mountAuth(root, (u) => {
    adoptAccount(u);
    // Fresh node for the app, so the sign-in screen's listeners go away with the old one.
    const fresh = root.cloneNode(false) as HTMLElement;
    root.replaceWith(fresh);
    start(u, fresh);
  });
}

if (import.meta.env.PROD) registerServiceWorker();

// Ask the browser not to evict our data under storage pressure (best effort, no prompt on Android Chrome).
void navigator.storage?.persist?.().catch(() => undefined);
