/** Thin JSON client for the app's own server (same origin). */

export interface User {
  id: number;
  name: string;
  phone: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Network failure (offline, server down) — distinct from an HTTP error answer. */
export class OfflineError extends Error {
  constructor() {
    super('offline');
    this.name = 'OfflineError';
  }
}

export async function api<T>(method: string, path: string, body?: unknown, options: { keepalive?: boolean } = {}): Promise<T> {
  let res: Response;
  try {
    const init: RequestInit = { method, credentials: 'same-origin', headers: { Accept: 'application/json' } };
    if (body !== undefined) {
      init.headers = { ...init.headers, 'Content-Type': 'application/json' };
      init.body = JSON.stringify(body);
    }
    if (options.keepalive) init.keepalive = true;
    res = await fetch(`./api/${path}`, init);
  } catch {
    throw new OfflineError();
  }
  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    /* empty or non-JSON body */
  }
  if (!res.ok) {
    const msg = (parsed as { error?: unknown } | null)?.error;
    throw new ApiError(res.status, typeof msg === 'string' ? msg : 'ارتباط با سرور ممکن نشد؛ دوباره امتحان کن.', parsed);
  }
  return parsed as T;
}

export const timeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tehran';
  } catch {
    return 'Asia/Tehran';
  }
};
