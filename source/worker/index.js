// MĀKTĀB habit tracker — Cloudflare Worker.
// Same API as server/index.mjs (Node), running on Workers + D1:
// accounts, per-user data sync, the nightly reminder (cron) and /admin.
// Static files (dist/) are served by Workers Static Assets; this script only
// runs for /api/* and /admin* (see wrangler.jsonc).
//
// Bindings: DB (D1), ASSETS. Vars: REMINDER_TIME, VAPID_PUBLIC_KEY, VAPID_SUBJECT.
// Secrets: VAPID_PRIVATE_KEY, ADMIN_PASSWORD.

import { incompleteTasks, isValidTimeZone, localNow, normalizePhone, parseClock, reminderPayload } from '../server/reminders.mjs';
import { bytesToB64url, b64urlToBytes, sendPush } from './webpush.js';

const SESSION_DAYS = 180;
const MAX_DATA_BYTES = 6 * 1024 * 1024;
const COOKIE = 'mk_session';
const REMINDER_WINDOW_MIN = 90;
/** Kept moderate so a sign-in fits the Workers free plan CPU budget; rate limits do the rest. */
const PBKDF2_ITERATIONS = 20_000;
const enc = new TextEncoder();

const nowIso = () => new Date().toISOString();

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
};

function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...SECURITY_HEADERS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

function text(status, body, headers = {}) {
  return new Response(body, {
    status,
    headers: { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

async function sha256(s) {
  return bytesToB64url(await crypto.subtle.digest('SHA-256', enc.encode(s)));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---------------------------------------------------------------- passwords & sessions

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256));
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bytesToB64url(salt)}$${bytesToB64url(hash)}`;
}

async function verifyPassword(password, stored) {
  const [kind, iter, salt, hash] = String(stored ?? '').split('$');
  if (kind !== 'pbkdf2' || !iter || !salt || !hash) {
    // Unknown user: spend the same work so timing doesn't reveal which phones exist.
    await pbkdf2(password, new Uint8Array(16), PBKDF2_ITERATIONS);
    return false;
  }
  const got = bytesToB64url(await pbkdf2(password, b64urlToBytes(salt), Number(iter)));
  return timingSafeEqual(got, hash);
}

function parseCookies(header) {
  const out = {};
  for (const part of String(header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

const sessionCookie = (token, maxAgeSec) => `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}; Secure`;

async function createSession(env, userId) {
  const token = bytesToB64url(crypto.getRandomValues(new Uint8Array(32)));
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(await sha256(token), userId, expires).run();
  return token;
}

async function sessionUser(env, req) {
  const token = parseCookies(req.headers.get('Cookie'))[COOKIE];
  if (!token) return null;
  const hash = await sha256(token);
  const row = await env.DB.prepare(
    'SELECT u.id, u.name, u.phone, u.tz, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?',
  )
    .bind(hash)
    .first();
  if (!row) return null;
  if (row.expires_at < nowIso()) {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(hash).run();
    return null;
  }
  return { id: row.id, name: row.name, phone: row.phone, tz: row.tz, tokenHash: hash };
}

// ---------------------------------------------------------------- rate limiting (D1, shared by all instances)

async function rateLimited(env, key, limit = 10, windowMs = 15 * 60_000) {
  const now = Date.now();
  const row = await env.DB.prepare('SELECT count, reset FROM attempts WHERE key = ?').bind(key).first();
  if (!row || row.reset < now) {
    await env.DB.prepare('INSERT OR REPLACE INTO attempts (key, count, reset) VALUES (?, 1, ?)').bind(key, now + windowMs).run();
    return false;
  }
  await env.DB.prepare('UPDATE attempts SET count = count + 1 WHERE key = ?').bind(key).run();
  return row.count + 1 > limit;
}

const clientIp = (req) => req.headers.get('CF-Connecting-IP') ?? '?';

// ---------------------------------------------------------------- request helpers

async function readJson(req, limit = 64 * 1024) {
  if (!String(req.headers.get('Content-Type') ?? '').startsWith('application/json')) throw new HttpError(415, 'نوع درخواست نامعتبر است.');
  const body = await req.text();
  if (body.length > limit) throw new HttpError(413, 'حجم داده بیش از حد مجاز است.');
  try {
    return JSON.parse(body);
  } catch {
    throw new HttpError(400, 'درخواست نامعتبر است.');
  }
}

/** Blocks cross-site writes: a browser always sends Origin on fetch POST/PUT/DELETE. */
function checkOrigin(req) {
  const origin = req.headers.get('Origin');
  if (!origin) return;
  let host;
  try {
    host = new URL(origin).host;
  } catch {
    throw new HttpError(403, 'درخواست غیرمجاز.');
  }
  if (host !== new URL(req.url).host) throw new HttpError(403, 'درخواست غیرمجاز.');
}

function validateName(raw) {
  const name = String(raw ?? '').trim().replace(/\s+/g, ' ');
  if (name.length < 3) return { error: 'نام و نام خانوادگی را کامل بنویس.' };
  if (name.length > 60) return { error: 'نام حداکثر ۶۰ حرف است.' };
  return { name };
}

function validatePassword(raw) {
  const password = String(raw ?? '');
  if (password.length < 6) return { error: 'رمز عبور دست‌کم ۶ کاراکتر باشد.' };
  if (password.length > 128) return { error: 'رمز عبور بیش از حد طولانی است.' };
  return { password };
}

const tzOrDefault = (tz) => (isValidTimeZone(tz) ? tz : 'Asia/Tehran');
const publicUser = (u) => ({ id: u.id, name: u.name, phone: u.phone });
const reminderTime = (env) => (/^\d{1,2}:\d{2}$/.test(env.REMINDER_TIME ?? '') ? env.REMINDER_TIME : '21:30');
const vapidOf = (env) => ({
  publicKey: env.VAPID_PUBLIC_KEY,
  privateKey: env.VAPID_PRIVATE_KEY,
  subject: env.VAPID_SUBJECT || 'mailto:admin@example.com',
});

function looksLikeAppData(d) {
  return (
    d !== null &&
    typeof d === 'object' &&
    !Array.isArray(d) &&
    typeof d.schemaVersion === 'number' &&
    Array.isArray(d.tasks) &&
    Array.isArray(d.containers) &&
    d.days !== null &&
    typeof d.days === 'object'
  );
}

// ---------------------------------------------------------------- API

const routes = {
  'POST /api/signup': async (req, env) => {
    checkOrigin(req);
    if (await rateLimited(env, `signup:${clientIp(req)}`, 20, 60 * 60_000)) throw new HttpError(429, 'تعداد تلاش‌ها زیاد است؛ کمی بعد دوباره امتحان کن.');
    const body = await readJson(req);
    const n = validateName(body.name);
    if (n.error) throw new HttpError(400, n.error);
    const phone = normalizePhone(body.phone);
    if (!phone) throw new HttpError(400, 'شماره همراه معتبر نیست (مثال: 09121234567).');
    const p = validatePassword(body.password);
    if (p.error) throw new HttpError(400, p.error);
    if (await env.DB.prepare('SELECT 1 FROM users WHERE phone = ?').bind(phone).first()) {
      throw new HttpError(409, 'با این شماره قبلاً حساب ساخته شده؛ وارد شو.');
    }
    const hash = await hashPassword(p.password);
    const now = nowIso();
    let row;
    try {
      row = await env.DB.prepare('INSERT INTO users (name, phone, pass_hash, tz, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?) RETURNING id')
        .bind(n.name, phone, hash, tzOrDefault(body.tz), now, now)
        .first();
    } catch (err) {
      if (String(err?.message).includes('UNIQUE')) throw new HttpError(409, 'با این شماره قبلاً حساب ساخته شده؛ وارد شو.');
      throw err;
    }
    const token = await createSession(env, row.id);
    return json(201, { user: { id: row.id, name: n.name, phone } }, { 'Set-Cookie': sessionCookie(token, SESSION_DAYS * 86400) });
  },

  'POST /api/login': async (req, env) => {
    checkOrigin(req);
    const body = await readJson(req);
    const phone = normalizePhone(body.phone);
    // Per IP, and per phone number whatever the IP.
    if ((await rateLimited(env, `login-ip:${clientIp(req)}`, 30)) || (await rateLimited(env, `login-phone:${phone ?? ''}`, 10))) {
      throw new HttpError(429, 'تعداد تلاش‌ها زیاد است؛ ۱۵ دقیقه‌ی دیگر امتحان کن.');
    }
    const user = phone ? await env.DB.prepare('SELECT id, name, phone, pass_hash FROM users WHERE phone = ?').bind(phone).first() : null;
    const ok = await verifyPassword(String(body.password ?? ''), user?.pass_hash);
    if (!user || !ok) throw new HttpError(401, 'شماره یا رمز عبور درست نیست.');
    await env.DB.prepare('UPDATE users SET last_seen = ?, tz = ? WHERE id = ?').bind(nowIso(), tzOrDefault(body.tz), user.id).run();
    const token = await createSession(env, user.id);
    return json(200, { user: publicUser(user) }, { 'Set-Cookie': sessionCookie(token, SESSION_DAYS * 86400) });
  },

  'POST /api/logout': async (req, env, user) => {
    checkOrigin(req);
    if (user) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(user.tokenHash).run();
    return json(200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
  },

  'GET /api/me': async (req, env, user) => {
    await env.DB.prepare('UPDATE users SET last_seen = ? WHERE id = ?').bind(nowIso(), user.id).run();
    return json(200, { user: publicUser(user) });
  },

  'GET /api/data': async (req, env, user) => {
    const row = await env.DB.prepare('SELECT data, rev FROM user_data WHERE user_id = ?').bind(user.id).first();
    await env.DB.prepare('UPDATE users SET last_seen = ? WHERE id = ?').bind(nowIso(), user.id).run();
    return json(200, row ? { rev: row.rev, data: JSON.parse(row.data) } : { rev: 0, data: null });
  },

  'PUT /api/data': async (req, env, user) => {
    checkOrigin(req);
    const body = await readJson(req, MAX_DATA_BYTES);
    if (!looksLikeAppData(body.data)) throw new HttpError(400, 'داده‌ی نامعتبر.');
    const baseRev = Number(body.baseRev ?? 0);
    const dataJson = JSON.stringify(body.data);
    const now = nowIso();
    // Compare-and-swap in one statement, so two devices can never both win the same revision.
    const res =
      baseRev === 0
        ? await env.DB.prepare('INSERT OR IGNORE INTO user_data (user_id, data, rev, updated_at) VALUES (?, ?, 1, ?)').bind(user.id, dataJson, now).run()
        : await env.DB.prepare('UPDATE user_data SET data = ?, rev = rev + 1, updated_at = ? WHERE user_id = ? AND rev = ?')
            .bind(dataJson, now, user.id, baseRev)
            .run();
    if (!res.meta.changes) {
      const row = await env.DB.prepare('SELECT data, rev FROM user_data WHERE user_id = ?').bind(user.id).first();
      return json(409, { rev: row?.rev ?? 0, data: row ? JSON.parse(row.data) : null });
    }
    const tz = isValidTimeZone(body.tz) ? body.tz : null;
    await env.DB.prepare('UPDATE users SET last_seen = ?, tz = COALESCE(?, tz) WHERE id = ?').bind(now, tz, user.id).run();
    return json(200, { rev: baseRev + 1 });
  },

  'GET /api/push/key': async (req, env) => json(200, { publicKey: env.VAPID_PUBLIC_KEY, reminderTime: reminderTime(env) }),

  'POST /api/push/subscribe': async (req, env, user) => {
    checkOrigin(req);
    const body = await readJson(req);
    const sub = body.subscription;
    const endpoint = sub?.endpoint;
    if (typeof endpoint !== 'string' || !/^https:\/\//.test(endpoint) || endpoint.length > 1000) throw new HttpError(400, 'اشتراک نامعتبر.');
    const p256dh = sub?.keys?.p256dh;
    const auth = sub?.keys?.auth;
    if (typeof p256dh !== 'string' || typeof auth !== 'string' || p256dh.length > 200 || auth.length > 100) throw new HttpError(400, 'اشتراک نامعتبر.');
    await env.DB.prepare(
      `INSERT INTO push_subs (endpoint, user_id, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`,
    )
      .bind(endpoint, user.id, p256dh, auth, nowIso())
      .run();
    if (isValidTimeZone(body.tz)) await env.DB.prepare('UPDATE users SET tz = ? WHERE id = ?').bind(body.tz, user.id).run();
    return json(200, { ok: true });
  },

  'POST /api/push/unsubscribe': async (req, env, user) => {
    checkOrigin(req);
    const body = await readJson(req);
    await env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ? AND user_id = ?').bind(String(body.endpoint ?? ''), user.id).run();
    return json(200, { ok: true });
  },

  'POST /api/push/test': async (req, env, user) => {
    checkOrigin(req);
    if (await rateLimited(env, `test-push:${user.id}`, 5, 60 * 60_000)) throw new HttpError(429, 'تعداد آزمایش‌ها زیاد است.');
    const sent = await pushToUser(env, user.id, {
      title: 'مکتب',
      body: `یادآوری‌ها روشن است. هر شب ساعت ${reminderTime(env)} کارهای ناتمام را یادآوری می‌کنیم.`,
      tag: 'maktab-test',
      url: './',
    });
    return json(200, { sent });
  },
};

const PUBLIC_ROUTES = new Set(['POST /api/signup', 'POST /api/login', 'POST /api/logout', 'GET /api/push/key']);

// ---------------------------------------------------------------- push & nightly reminder

async function pushToUser(env, userId, payload) {
  const { results: subs } = await env.DB.prepare('SELECT endpoint, p256dh, auth FROM push_subs WHERE user_id = ?').bind(userId).all();
  let sent = 0;
  for (const s of subs) {
    try {
      const status = await sendPush(s, payload, vapidOf(env));
      if (status >= 200 && status < 300) sent += 1;
      // 404/410: the browser dropped the subscription (uninstalled, permission revoked).
      else if (status === 404 || status === 410) await env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ?').bind(s.endpoint).run();
      else console.warn(`push failed for user ${userId}: HTTP ${status}`);
    } catch (err) {
      console.warn(`push failed for user ${userId}: ${err?.message ?? err}`);
    }
  }
  return sent;
}

async function runReminders(env) {
  const reminderMin = parseClock(reminderTime(env));
  const { results: users } = await env.DB.prepare('SELECT DISTINCT u.id, u.tz FROM users u JOIN push_subs p ON p.user_id = u.id').all();
  for (const u of users) {
    const { day, minutes } = localNow(u.tz);
    if (minutes < reminderMin || minutes >= reminderMin + REMINDER_WINDOW_MIN) continue;
    if (await env.DB.prepare('SELECT 1 FROM reminders_sent WHERE user_id = ? AND day = ?').bind(u.id, day).first()) continue;
    const row = await env.DB.prepare('SELECT data FROM user_data WHERE user_id = ?').bind(u.id).first();
    let names = [];
    try {
      names = row ? incompleteTasks(JSON.parse(row.data), day) : [];
    } catch {
      names = [];
    }
    await env.DB.prepare('INSERT OR IGNORE INTO reminders_sent (user_id, day, sent_at, task_count) VALUES (?, ?, ?, ?)')
      .bind(u.id, day, nowIso(), names.length)
      .run();
    if (names.length === 0) continue; // everything done: no nagging
    const sent = await pushToUser(env, u.id, reminderPayload(names));
    // Nothing delivered: unmark so the next run inside the window retries.
    if (sent === 0) await env.DB.prepare('DELETE FROM reminders_sent WHERE user_id = ? AND day = ?').bind(u.id, day).run();
  }
  // Housekeeping.
  await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(nowIso()).run();
  await env.DB.prepare('DELETE FROM attempts WHERE reset < ?').bind(Date.now()).run();
}

// ---------------------------------------------------------------- admin

const ADMIN_CSP = {
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
};

const ADMIN_JS = `document.addEventListener('submit', function (e) {
  if (e.target.dataset.confirm && !confirm('رمز عبور تازه برای این کاربر ساخته شود؟ رمز فعلی او از کار می‌افتد.')) e.preventDefault();
});`;

async function adminAuthorized(env, req) {
  if (!env.ADMIN_PASSWORD) return false;
  const header = String(req.headers.get('Authorization') ?? '');
  if (!header.startsWith('Basic ')) return false;
  let decoded;
  try {
    decoded = new TextDecoder().decode(b64urlToBytes(header.slice(6).trim().replace(/\+/g, '-').replace(/\//g, '_')));
  } catch {
    return false;
  }
  const password = decoded.slice(decoded.indexOf(':') + 1);
  return timingSafeEqual(await sha256(password), await sha256(env.ADMIN_PASSWORD));
}

const escHtml = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const faDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran' }).format(new Date(iso));
  } catch {
    return iso;
  }
};

async function adminUsers(env) {
  const { results } = await env.DB.prepare(
    `SELECT u.id, u.name, u.phone, u.created_at, u.last_seen, u.tz,
            (SELECT COUNT(*) FROM push_subs p WHERE p.user_id = u.id) AS subs,
            d.data AS data
     FROM users u LEFT JOIN user_data d ON d.user_id = u.id
     ORDER BY u.created_at DESC`,
  ).all();
  return results.map((u) => {
    let days = 0;
    try {
      days = u.data ? Object.keys(JSON.parse(u.data).days ?? {}).length : 0;
    } catch {
      /* ignore */
    }
    return { id: u.id, name: u.name, phone: u.phone, created_at: u.created_at, last_seen: u.last_seen, tz: u.tz, subs: u.subs, days };
  });
}

async function adminPage(env, notice = '') {
  const users = await adminUsers(env);
  const rows = users
    .map(
      (u) => `<tr>
        <td>${u.id}</td><td>${escHtml(u.name)}</td><td dir="ltr">${escHtml(u.phone)}</td>
        <td>${faDate(u.created_at)}</td><td>${faDate(u.last_seen)}</td>
        <td>${u.days}</td><td>${u.subs ? 'روشن' : '—'}</td>
        <td>
          <form method="post" action="/admin/test-push"><input type="hidden" name="id" value="${u.id}"><button ${u.subs ? '' : 'disabled'}>یادآوری آزمایشی</button></form>
          <form method="post" action="/admin/reset-password" data-confirm="1"><input type="hidden" name="id" value="${u.id}"><button>رمز تازه</button></form>
        </td>
      </tr>`,
    )
    .join('');
  const html = `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex"><title>مکتب — کاربران</title>
  <style>
    body{font-family:Vazirmatn,Tahoma,system-ui,sans-serif;background:#0e0a09;color:#f1e8da;margin:0;padding:24px}
    h1{font-weight:900;margin:0 0 4px} .muted{color:#cdbfa9;font-size:13px}
    table{border-collapse:collapse;width:100%;margin-top:20px;font-size:13px}
    th,td{border-bottom:1px solid #4a3226;padding:10px 8px;text-align:right;vertical-align:middle}
    th{color:#d9a25a;font-weight:500;font-size:12px}
    a{color:#d9a25a} form{display:inline} button{background:none;border:1px solid #4a3226;color:#f1e8da;padding:4px 8px;margin:2px;border-radius:2px;font:inherit;font-size:12px;cursor:pointer}
    button[disabled]{opacity:.35;cursor:default} .notice{border:1px solid #8e3b26;padding:12px;margin-top:16px}
    .wrap{overflow-x:auto}
  </style></head><body>
  <h1>کاربران مکتب</h1>
  <div class="muted">${users.length} کاربر · ${users.filter((u) => u.subs).length} نفر یادآوری را روشن کرده‌اند · <a href="/admin/users.csv">دریافت CSV</a></div>
  ${notice ? `<div class="notice">${notice}</div>` : ''}
  <div class="wrap"><table>
    <thead><tr><th>#</th><th>نام و نام خانوادگی</th><th>شماره همراه</th><th>ثبت‌نام</th><th>آخرین فعالیت</th><th>روزهای ثبت‌شده</th><th>یادآوری</th><th></th></tr></thead>
    <tbody>${rows || '<tr><td colspan="8" class="muted">هنوز کسی ثبت‌نام نکرده.</td></tr>'}</tbody>
  </table></div>
  <p class="muted">رمزهای عبور به‌صورت هش ذخیره می‌شوند و قابل خواندن نیستند؛ برای کاربری که رمزش را فراموش کرده «رمز تازه» بساز و به او بده.</p>
  <script src="/admin/admin.js"></script>
  </body></html>`;
  return new Response(html, {
    headers: { ...SECURITY_HEADERS, ...ADMIN_CSP, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function handleAdmin(req, env, path) {
  if (!env.ADMIN_PASSWORD) return text(404, 'Not found');
  if (!(await adminAuthorized(env, req))) {
    if ((await rateLimited(env, `admin:${clientIp(req)}`, 30)) || (await rateLimited(env, 'admin:any', 200))) return text(429, 'Too many attempts');
    return text(401, 'Authentication required', { 'WWW-Authenticate': 'Basic realm="Maktab admin", charset="UTF-8"' });
  }
  if (req.method === 'GET' && path === '/admin') return adminPage(env);
  if (req.method === 'GET' && path === '/admin/admin.js') {
    return new Response(ADMIN_JS, { headers: { ...SECURITY_HEADERS, 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
  if (req.method === 'GET' && path === '/admin/users.csv') {
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""').replace(/^([=+\-@\t\r])/, "'$1")}"`;
    const lines = [['id', 'name', 'phone', 'signed_up', 'last_seen', 'days_recorded', 'reminders_on'].join(',')];
    for (const u of await adminUsers(env)) lines.push([u.id, u.name, u.phone, u.created_at, u.last_seen, u.days, u.subs ? 'yes' : 'no'].map(cell).join(','));
    return new Response(`﻿${lines.join('\r\n')}`, {
      headers: { ...SECURITY_HEADERS, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="maktab-users.csv"', 'Cache-Control': 'no-store' },
    });
  }
  if (req.method === 'POST' && (path === '/admin/test-push' || path === '/admin/reset-password')) {
    checkOrigin(req);
    const form = new URLSearchParams(await req.text());
    const id = Number(form.get('id'));
    const user = await env.DB.prepare('SELECT id, name, tz FROM users WHERE id = ?').bind(id).first();
    if (!user) return adminPage(env, 'کاربر پیدا نشد.');
    if (path === '/admin/test-push') {
      const data = await env.DB.prepare('SELECT data FROM user_data WHERE user_id = ?').bind(id).first();
      let names = [];
      try {
        names = data ? incompleteTasks(JSON.parse(data.data), localNow(user.tz).day) : [];
      } catch {
        names = [];
      }
      const sent = await pushToUser(env, id, names.length ? reminderPayload(names) : { title: 'مکتب', body: 'همه‌ی کارهای امروز کامل است.', tag: 'maktab-test', url: './' });
      return adminPage(env, `یادآوری برای ${escHtml(user.name)} به ${sent} دستگاه فرستاده شد.`);
    }
    const temp = bytesToB64url(crypto.getRandomValues(new Uint8Array(6)));
    await env.DB.prepare('UPDATE users SET pass_hash = ? WHERE id = ?').bind(await hashPassword(temp), id).run();
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run();
    return adminPage(env, `رمز تازه‌ی ${escHtml(user.name)}: <strong dir="ltr">${escHtml(temp)}</strong> — آن را به کاربر بده. (این صفحه را رفرش نکن؛ رفرش رمز دیگری می‌سازد.)`);
  }
  return text(404, 'Not found');
}

// ---------------------------------------------------------------- entry points

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;
    try {
      if (path === '/admin' || path.startsWith('/admin/')) return await handleAdmin(req, env, path);
      if (path.startsWith('/api/')) {
        const key = `${req.method} ${path}`;
        const handler = routes[key];
        if (!handler) throw new HttpError(404, 'یافت نشد.');
        const user = await sessionUser(env, req);
        if (!PUBLIC_ROUTES.has(key) && !user) throw new HttpError(401, 'دوباره وارد شو.');
        return await handler(req, env, user);
      }
      return env.ASSETS.fetch(req);
    } catch (err) {
      if (err instanceof HttpError) return json(err.status, { error: err.message });
      console.error(err);
      return json(500, { error: 'خطای سرور؛ دوباره امتحان کن.' });
    }
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(runReminders(env));
  },
};
