// MĀKTĀB habit tracker — server.
// Serves the built PWA (dist/), user accounts, per-user data sync,
// the nightly Web Push reminder and a password-protected admin page.
//
// Env: PORT (8080) · DATA_DIR (./data) · ADMIN_PASSWORD (enables /admin)
//      REMINDER_TIME ("21:30", user's local time) · VAPID_SUBJECT (mailto:… or https://…)
//      TRUST_PROXY ("1" behind your own nginx/Caddy: trust X-Forwarded-For/-Proto/-Host)
//      COOKIE_SECURE ("1" forces Secure cookies; otherwise follows the request / X-Forwarded-Proto)

import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import webpush from 'web-push';
import { incompleteTasks, isValidTimeZone, localNow, normalizePhone, parseClock, reminderPayload } from './reminders.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = resolve(ROOT, 'dist');
const DATA_DIR = resolve(process.env.DATA_DIR ?? join(ROOT, 'data'));
const PORT = Number(process.env.PORT ?? 8080);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';
const REMINDER_TIME = /^\d{1,2}:\d{2}$/.test(process.env.REMINDER_TIME ?? '') ? process.env.REMINDER_TIME : '21:30';
const REMINDER_MIN = parseClock(REMINDER_TIME);
/** Reminders are only sent inside this window, so a server restart late at night doesn't wake people up. */
const REMINDER_WINDOW_MIN = 90;
const SESSION_DAYS = 180;
const MAX_DATA_BYTES = 6 * 1024 * 1024;
const COOKIE = 'mk_session';
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const MAX_TRACKED = 50_000;

mkdirSync(DATA_DIR, { recursive: true });
const scryptAsync = promisify(scrypt);

// ---------------------------------------------------------------- database

const db = new DatabaseSync(join(DATA_DIR, 'maktab.db'));
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    pass_hash TEXT NOT NULL,
    tz TEXT NOT NULL DEFAULT 'Asia/Tehran',
    created_at TEXT NOT NULL,
    last_seen TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS user_data (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    rev INTEGER NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS push_subs (
    endpoint TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reminders_sent (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day TEXT NOT NULL,
    sent_at TEXT NOT NULL,
    task_count INTEGER NOT NULL,
    PRIMARY KEY (user_id, day)
  );
`);

const nowIso = () => new Date().toISOString();
const sha256 = (s) => createHash('sha256').update(s).digest('hex');

// ---------------------------------------------------------------- VAPID keys

const vapidFile = join(DATA_DIR, 'vapid.json');
let vapid;
if (existsSync(vapidFile)) {
  vapid = JSON.parse(readFileSync(vapidFile, 'utf8'));
} else {
  vapid = webpush.generateVAPIDKeys();
  writeFileSync(vapidFile, JSON.stringify(vapid), { mode: 0o600 });
}
webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com', vapid.publicKey, vapid.privateKey);

// ---------------------------------------------------------------- passwords & sessions

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

async function verifyPassword(password, stored) {
  const [, saltB64, keyB64] = String(stored).split('$');
  if (!saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64');
  const key = await scryptAsync(password, Buffer.from(saltB64, 'base64'), expected.length, { N: 16384, r: 8, p: 1 });
  return timingSafeEqual(key, expected);
}

/** Constant-time check against a dummy hash so unknown phones take as long as wrong passwords. */
const DUMMY_HASH = await hashPassword(randomBytes(12).toString('hex'));

function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(sha256(token), userId, expires);
  return token;
}

function parseCookies(header) {
  const out = {};
  for (const part of String(header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function sessionUser(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (!token) return null;
  const row = db
    .prepare('SELECT u.id, u.name, u.phone, u.tz, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?')
    .get(sha256(token));
  if (!row) return null;
  if (row.expires_at < nowIso()) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
    return null;
  }
  return { id: row.id, name: row.name, phone: row.phone, tz: row.tz, token };
}

function isSecure(req) {
  if (process.env.COOKIE_SECURE === '1') return true;
  if (process.env.COOKIE_SECURE === '0') return false;
  return req.socket.encrypted === true || (TRUST_PROXY && String(req.headers['x-forwarded-proto'] ?? '').split(',')[0]?.trim() === 'https');
}

function sessionCookie(req, token, maxAgeSec) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${isSecure(req) ? '; Secure' : ''}`;
}

// ---------------------------------------------------------------- rate limiting (in memory)

const attempts = new Map();
function rateLimited(key, limit = 10, windowMs = 15 * 60_000) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.reset < now) {
    if (attempts.size >= MAX_TRACKED) attempts.clear(); // memory cap under a flood
    attempts.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of attempts) if (v.reset < now) attempts.delete(k);
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(nowIso());
}, 10 * 60_000).unref();

/** X-Forwarded-For is only trusted behind a proxy you control (TRUST_PROXY=1); otherwise anyone could fake it. */
const clientIp = (req) =>
  (TRUST_PROXY ? String(req.headers['x-forwarded-for'] ?? '').split(',').at(-1)?.trim() : '') || req.socket.remoteAddress || '?';

// ---------------------------------------------------------------- HTTP helpers

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
};

function send(res, status, body, headers = {}) {
  const isJson = typeof body !== 'string' && !Buffer.isBuffer(body);
  const payload = isJson ? JSON.stringify(body) : body;
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    'Content-Type': isJson ? 'application/json; charset=utf-8' : 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(payload);
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function readBody(req, limit = 64 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new HttpError(413, 'حجم داده بیش از حد مجاز است.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function readJson(req, limit) {
  if (!String(req.headers['content-type'] ?? '').startsWith('application/json')) throw new HttpError(415, 'نوع درخواست نامعتبر است.');
  try {
    return JSON.parse(await readBody(req, limit));
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(400, 'درخواست نامعتبر است.');
  }
}

/** Blocks cross-site writes: a browser always sends Origin on fetch POST/PUT/DELETE. */
function checkOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return;
  let host;
  try {
    host = new URL(origin).host;
  } catch {
    throw new HttpError(403, 'درخواست غیرمجاز.');
  }
  const expected = String((TRUST_PROXY && req.headers['x-forwarded-host']) || req.headers.host || '');
  if (host !== expected) throw new HttpError(403, 'درخواست غیرمجاز.');
}

const publicUser = (u) => ({ id: u.id, name: u.name, phone: u.phone });

// ---------------------------------------------------------------- API

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

/** Light structural check; the app validates strictly when it loads the data. */
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

const routes = {
  'POST /api/signup': async (req, res) => {
    checkOrigin(req);
    if (rateLimited(`signup:${clientIp(req)}`, 20, 60 * 60_000)) throw new HttpError(429, 'تعداد تلاش‌ها زیاد است؛ کمی بعد دوباره امتحان کن.');
    const body = await readJson(req);
    const n = validateName(body.name);
    if (n.error) throw new HttpError(400, n.error);
    const phone = normalizePhone(body.phone);
    if (!phone) throw new HttpError(400, 'شماره همراه معتبر نیست (مثال: 09121234567).');
    const p = validatePassword(body.password);
    if (p.error) throw new HttpError(400, p.error);
    if (db.prepare('SELECT 1 FROM users WHERE phone = ?').get(phone)) {
      throw new HttpError(409, 'با این شماره قبلاً حساب ساخته شده؛ وارد شو.');
    }
    const hash = await hashPassword(p.password);
    const now = nowIso();
    let result;
    try {
      result = db
        .prepare('INSERT INTO users (name, phone, pass_hash, tz, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?)')
        .run(n.name, phone, hash, tzOrDefault(body.tz), now, now);
    } catch (err) {
      if (String(err?.message).includes('UNIQUE')) throw new HttpError(409, 'با این شماره قبلاً حساب ساخته شده؛ وارد شو.');
      throw err;
    }
    const id = Number(result.lastInsertRowid);
    const token = createSession(id);
    send(res, 201, { user: { id, name: n.name, phone } }, { 'Set-Cookie': sessionCookie(req, token, SESSION_DAYS * 86400) });
  },

  'POST /api/login': async (req, res) => {
    checkOrigin(req);
    const body = await readJson(req);
    const phone = normalizePhone(body.phone);
    // Per IP, and per phone number whatever the IP (stops spreading guesses over many addresses).
    if (rateLimited(`login-ip:${clientIp(req)}`, 30) || rateLimited(`login-phone:${phone ?? ''}`, 10)) {
      throw new HttpError(429, 'تعداد تلاش‌ها زیاد است؛ ۱۵ دقیقه‌ی دیگر امتحان کن.');
    }
    const password = String(body.password ?? '');
    const user = phone ? db.prepare('SELECT id, name, phone, pass_hash FROM users WHERE phone = ?').get(phone) : null;
    const ok = await verifyPassword(password, user?.pass_hash ?? DUMMY_HASH);
    if (!user || !ok) throw new HttpError(401, 'شماره یا رمز عبور درست نیست.');
    db.prepare('UPDATE users SET last_seen = ?, tz = ? WHERE id = ?').run(nowIso(), tzOrDefault(body.tz), user.id);
    const token = createSession(user.id);
    send(res, 200, { user: publicUser(user) }, { 'Set-Cookie': sessionCookie(req, token, SESSION_DAYS * 86400) });
  },

  'POST /api/logout': async (req, res) => {
    checkOrigin(req);
    const user = sessionUser(req);
    if (user) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(user.token));
    send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req, '', 0) });
  },

  'GET /api/me': async (req, res, user) => {
    db.prepare('UPDATE users SET last_seen = ? WHERE id = ?').run(nowIso(), user.id);
    send(res, 200, { user: publicUser(user) });
  },

  'GET /api/data': async (req, res, user) => {
    const row = db.prepare('SELECT data, rev FROM user_data WHERE user_id = ?').get(user.id);
    db.prepare('UPDATE users SET last_seen = ? WHERE id = ?').run(nowIso(), user.id);
    send(res, 200, row ? { rev: row.rev, data: JSON.parse(row.data) } : { rev: 0, data: null });
  },

  'PUT /api/data': async (req, res, user) => {
    checkOrigin(req);
    const body = await readJson(req, MAX_DATA_BYTES);
    if (!looksLikeAppData(body.data)) throw new HttpError(400, 'داده‌ی نامعتبر.');
    const baseRev = Number(body.baseRev ?? 0);
    const row = db.prepare('SELECT data, rev FROM user_data WHERE user_id = ?').get(user.id);
    const current = row?.rev ?? 0;
    if (baseRev !== current) {
      // Another device saved in between: hand back the newer copy so the client can merge.
      send(res, 409, { rev: current, data: row ? JSON.parse(row.data) : null });
      return;
    }
    const rev = current + 1;
    const json = JSON.stringify(body.data);
    db.prepare(
      `INSERT INTO user_data (user_id, data, rev, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, rev = excluded.rev, updated_at = excluded.updated_at`,
    ).run(user.id, json, rev, nowIso());
    const tz = isValidTimeZone(body.tz) ? body.tz : null;
    db.prepare('UPDATE users SET last_seen = ?, tz = COALESCE(?, tz) WHERE id = ?').run(nowIso(), tz, user.id);
    send(res, 200, { rev });
  },

  'GET /api/push/key': async (req, res) => {
    send(res, 200, { publicKey: vapid.publicKey, reminderTime: REMINDER_TIME });
  },

  'POST /api/push/subscribe': async (req, res, user) => {
    checkOrigin(req);
    const body = await readJson(req);
    const sub = body.subscription;
    const endpoint = sub?.endpoint;
    if (typeof endpoint !== 'string' || !/^https:\/\//.test(endpoint) || endpoint.length > 1000) throw new HttpError(400, 'اشتراک نامعتبر.');
    const p256dh = sub?.keys?.p256dh;
    const auth = sub?.keys?.auth;
    if (typeof p256dh !== 'string' || typeof auth !== 'string' || p256dh.length > 200 || auth.length > 100) throw new HttpError(400, 'اشتراک نامعتبر.');
    db.prepare(
      `INSERT INTO push_subs (endpoint, user_id, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`,
    ).run(endpoint, user.id, p256dh, auth, nowIso());
    if (isValidTimeZone(body.tz)) db.prepare('UPDATE users SET tz = ? WHERE id = ?').run(body.tz, user.id);
    send(res, 200, { ok: true });
  },

  'POST /api/push/unsubscribe': async (req, res, user) => {
    checkOrigin(req);
    const body = await readJson(req);
    db.prepare('DELETE FROM push_subs WHERE endpoint = ? AND user_id = ?').run(String(body.endpoint ?? ''), user.id);
    send(res, 200, { ok: true });
  },

  'POST /api/push/test': async (req, res, user) => {
    checkOrigin(req);
    if (rateLimited(`test-push:${user.id}`, 5, 60 * 60_000)) throw new HttpError(429, 'تعداد آزمایش‌ها زیاد است.');
    const sent = await pushToUser(user.id, { title: 'مکتب', body: 'یادآوری‌ها روشن است. هر شب ساعت ۲۱:۳۰ کارهای ناتمام را یادآوری می‌کنیم.', tag: 'maktab-test', url: './' });
    send(res, 200, { sent });
  },
};

const PUBLIC_ROUTES = new Set(['POST /api/signup', 'POST /api/login', 'POST /api/logout', 'GET /api/push/key']);

// ---------------------------------------------------------------- push

async function pushToUser(userId, payload) {
  const subs = db.prepare('SELECT endpoint, p256dh, auth FROM push_subs WHERE user_id = ?').all(userId);
  let sent = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), {
        TTL: 2 * 3600,
        urgency: 'normal',
      });
      sent += 1;
    } catch (err) {
      // 404/410: the browser dropped the subscription (uninstalled, permission revoked).
      if (err?.statusCode === 404 || err?.statusCode === 410) db.prepare('DELETE FROM push_subs WHERE endpoint = ?').run(s.endpoint);
      else console.warn(`push failed for user ${userId}: ${err?.statusCode ?? ''} ${err?.message ?? err}`);
    }
  }
  return sent;
}

let reminderRunning = false;
async function runReminders() {
  if (reminderRunning) return;
  reminderRunning = true;
  try {
    const users = db
      .prepare('SELECT DISTINCT u.id, u.tz FROM users u JOIN push_subs p ON p.user_id = u.id')
      .all();
    for (const u of users) {
      const { day, minutes } = localNow(u.tz);
      if (minutes < REMINDER_MIN || minutes >= REMINDER_MIN + REMINDER_WINDOW_MIN) continue;
      if (db.prepare('SELECT 1 FROM reminders_sent WHERE user_id = ? AND day = ?').get(u.id, day)) continue;
      const row = db.prepare('SELECT data FROM user_data WHERE user_id = ?').get(u.id);
      let names;
      try {
        names = row ? incompleteTasks(JSON.parse(row.data), day) : [];
      } catch {
        names = [];
      }
      // Mark first so a slow push service can never cause a double reminder.
      db.prepare('INSERT OR IGNORE INTO reminders_sent (user_id, day, sent_at, task_count) VALUES (?, ?, ?, ?)').run(u.id, day, nowIso(), names.length);
      if (names.length === 0) continue; // everything done: no nagging
      const sent = await pushToUser(u.id, reminderPayload(names));
      // Nothing delivered (push service unreachable): unmark so the next run inside the window retries.
      if (sent === 0 && db.prepare('SELECT 1 FROM push_subs WHERE user_id = ?').get(u.id)) {
        db.prepare('DELETE FROM reminders_sent WHERE user_id = ? AND day = ?').run(u.id, day);
      }
    }
  } catch (err) {
    console.error('reminder run failed', err);
  } finally {
    reminderRunning = false;
  }
}
setInterval(() => void runReminders(), 30_000).unref();

// ---------------------------------------------------------------- admin

/** No inline script can run on the admin page, whatever a user puts in their name. */
const ADMIN_CSP = { 'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" };

function adminAuthorized(req) {
  if (!ADMIN_PASSWORD) return false;
  const header = String(req.headers.authorization ?? '');
  if (!header.startsWith('Basic ')) return false;
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const password = decoded.slice(decoded.indexOf(':') + 1);
  const a = Buffer.from(sha256(password));
  const b = Buffer.from(sha256(ADMIN_PASSWORD));
  return timingSafeEqual(a, b);
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

function adminUsers() {
  return db
    .prepare(
      `SELECT u.id, u.name, u.phone, u.created_at, u.last_seen, u.tz,
              (SELECT COUNT(*) FROM push_subs p WHERE p.user_id = u.id) AS subs,
              d.data AS data
       FROM users u LEFT JOIN user_data d ON d.user_id = u.id
       ORDER BY u.created_at DESC`,
    )
    .all()
    .map((u) => {
      let days = 0;
      try {
        days = u.data ? Object.keys(JSON.parse(u.data).days ?? {}).length : 0;
      } catch {
        /* ignore */
      }
      return { id: u.id, name: u.name, phone: u.phone, created_at: u.created_at, last_seen: u.last_seen, tz: u.tz, subs: u.subs, days };
    });
}

function adminPage(notice = '') {
  const users = adminUsers();
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
  return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>مکتب — کاربران</title>
  <style>
    body{font-family:Vazirmatn,system-ui,sans-serif;background:#0e0a09;color:#f1e8da;margin:0;padding:24px}
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
  <p class="muted">رمزهای عبور به‌صورت هش (scrypt) ذخیره می‌شوند و قابل خواندن نیستند؛ برای کاربری که رمزش را فراموش کرده «رمز تازه» بساز و به او بده.</p>
  <script src="/admin/admin.js"></script>
  </body></html>`;
}

const ADMIN_JS = `document.addEventListener('submit', function (e) {
  if (e.target.dataset.confirm && !confirm('رمز عبور تازه برای این کاربر ساخته شود؟ رمز فعلی او از کار می‌افتد.')) e.preventDefault();
});`;

async function handleAdmin(req, res, path) {
  if (!ADMIN_PASSWORD) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
  if (!adminAuthorized(req)) {
    if (rateLimited(`admin:${clientIp(req)}`, 30) || rateLimited('admin:any', 200)) return send(res, 429, 'Too many attempts', { 'Content-Type': 'text/plain' });
    return send(res, 401, 'Authentication required', { 'WWW-Authenticate': 'Basic realm="Maktab admin", charset="UTF-8"', 'Content-Type': 'text/plain' });
  }
  if (req.method === 'GET' && path === '/admin') return send(res, 200, adminPage(), ADMIN_CSP);
  if (req.method === 'GET' && path === '/admin/admin.js') return send(res, 200, ADMIN_JS, { 'Content-Type': 'text/javascript; charset=utf-8' });
  if (req.method === 'GET' && path === '/admin/users.csv') {
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""').replace(/^([=+\-@\t\r])/, "'$1")}"`;
    const lines = [['id', 'name', 'phone', 'signed_up', 'last_seen', 'days_recorded', 'reminders_on'].join(',')];
    for (const u of adminUsers()) lines.push([u.id, u.name, u.phone, u.created_at, u.last_seen, u.days, u.subs ? 'yes' : 'no'].map(cell).join(','));
    return send(res, 200, `﻿${lines.join('\r\n')}`, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="maktab-users.csv"',
    });
  }
  if (req.method === 'POST' && (path === '/admin/test-push' || path === '/admin/reset-password')) {
    checkOrigin(req);
    const form = new URLSearchParams(await readBody(req));
    const id = Number(form.get('id'));
    const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(id);
    if (!user) return send(res, 200, adminPage('کاربر پیدا نشد.'), ADMIN_CSP);
    if (path === '/admin/test-push') {
      const data = db.prepare('SELECT data FROM user_data WHERE user_id = ?').get(id);
      const tz = db.prepare('SELECT tz FROM users WHERE id = ?').get(id).tz;
      let names = [];
      try {
        names = data ? incompleteTasks(JSON.parse(data.data), localNow(tz).day) : [];
      } catch {
        names = [];
      }
      const sent = await pushToUser(id, names.length ? reminderPayload(names) : { title: 'مکتب', body: 'همه‌ی کارهای امروز کامل است. 👏', tag: 'maktab-test', url: './' });
      return send(res, 200, adminPage(`یادآوری برای ${escHtml(user.name)} به ${sent} دستگاه فرستاده شد.`), ADMIN_CSP);
    }
    const temp = randomBytes(6).toString('base64url');
    db.prepare('UPDATE users SET pass_hash = ? WHERE id = ?').run(await hashPassword(temp), id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
    return send(res, 200, adminPage(`رمز تازه‌ی ${escHtml(user.name)}: <strong dir="ltr">${escHtml(temp)}</strong> — آن را به کاربر بده. (این صفحه را رفرش نکن؛ رفرش رمز دیگری می‌سازد.)`), ADMIN_CSP);
  }
  return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
}

// ---------------------------------------------------------------- static files

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res, path) {
  let rel;
  try {
    rel = normalize(decodeURIComponent(path)).replace(/^([/\\])+/, '');
  } catch {
    return send(res, 400, 'Bad request', { 'Content-Type': 'text/plain' });
  }
  let file = resolve(DIST, rel || 'index.html');
  if (file !== DIST && !file.startsWith(DIST + sep)) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
  let stat = existsSync(file) ? statSync(file) : null;
  if (!stat || stat.isDirectory()) {
    // SPA fallback for navigations; real 404 for missing assets.
    if (extname(rel)) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
    file = join(DIST, 'index.html');
    stat = existsSync(file) ? statSync(file) : null;
    if (!stat) return send(res, 503, 'App not built. Run: npm run build', { 'Content-Type': 'text/plain' });
  }
  const name = file.slice(DIST.length + 1).replace(/\\/g, '/');
  const cache = name.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'no-cache';
  res.writeHead(200, {
    ...SECURITY_HEADERS,
    'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': cache,
  });
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
}

// ---------------------------------------------------------------- server

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = url.pathname;
  try {
    if (path === '/admin' || path.startsWith('/admin/')) return await handleAdmin(req, res, path);
    if (path.startsWith('/api/')) {
      const key = `${req.method} ${path}`;
      const handler = routes[key];
      if (!handler) throw new HttpError(404, 'یافت نشد.');
      const user = sessionUser(req);
      if (!PUBLIC_ROUTES.has(key) && !user) throw new HttpError(401, 'دوباره وارد شو.');
      return await handler(req, res, user);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Method not allowed');
    return serveStatic(req, res, path);
  } catch (err) {
    if (err instanceof HttpError) return send(res, err.status, { error: err.message });
    console.error(err);
    return send(res, 500, { error: 'خطای سرور؛ دوباره امتحان کن.' });
  }
});

server.listen(PORT, () => {
  console.log(`Maktab server on http://localhost:${PORT}  (data: ${DATA_DIR}, admin: ${ADMIN_PASSWORD ? '/admin' : 'disabled — set ADMIN_PASSWORD'})`);
  void runReminders();
});
