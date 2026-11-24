-- Same tables as the Node server (server/index.mjs), plus shared rate-limit counters.
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
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
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
CREATE INDEX IF NOT EXISTS push_subs_user ON push_subs(user_id);
CREATE TABLE IF NOT EXISTS reminders_sent (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  task_count INTEGER NOT NULL,
  PRIMARY KEY (user_id, day)
);
CREATE TABLE IF NOT EXISTS attempts (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset INTEGER NOT NULL
);
