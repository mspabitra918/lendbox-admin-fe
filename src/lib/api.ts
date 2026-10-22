import type { PaginationMeta } from "./types";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4100").replace(/\/+$/, "");
export const API_PREFIX = "/api/v1";

const SESSION_KEY = "lendbox.admin.session";
export const SESSION_EXPIRED_EVENT = "lendbox:admin-session-expired";

export interface StoredSession {
  accessToken: string;
  expiresAt: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function readSession(): StoredSession | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as StoredSession;
    if (!session.accessToken || new Date(session.expiresAt).getTime() <= Date.now()) {
      window.sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function writeSession(session: StoredSession | null) {
  try {
    if (session) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage unavailable (private mode); the session just won't survive a reload.
  }
}

type Query = Record<string, string | number | undefined | null>;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
}

interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  error?: { statusCode: number; code: string; message: string; details?: unknown };
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<Envelope<T>> {
  const url = new URL(`${API_BASE_URL}${API_PREFIX}${path}`);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const session = typeof window !== "undefined" ? readSession() : null;
  if (session) headers.Authorization = `Bearer ${session.accessToken}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: "include",
      cache: "no-store",
      signal: options.signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiError(`Cannot reach the API at ${API_BASE_URL}. Is the backend running?`, 0, "NETWORK_ERROR");
  }

  let payload: Envelope<T> | null = null;
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.success === false) {
    const err = payload?.error;
    const details = err?.details;
    let message = err?.message ?? `Request failed (${response.status}).`;
    if (err?.code === "VALIDATION_ERROR" && Array.isArray(details) && details.length) {
      message = details.join(", ");
    }
    if (response.status === 401 && path !== "/auth/admin/login") {
      writeSession(null);
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(message, response.status, err?.code, details);
  }

  return payload;
}

export const api = {
  get: async <T>(path: string, query?: Query, signal?: AbortSignal) => (await request<T>(path, { query, signal })).data,
  getPage: async <T>(path: string, query?: Query, signal?: AbortSignal) => {
    const res = await request<T[]>(path, { query, signal });
    return { data: res.data, meta: res.meta as PaginationMeta };
  },
  post: async <T>(path: string, body?: unknown) => (await request<T>(path, { method: "POST", body })).data,
  patch: async <T>(path: string, body?: unknown) => (await request<T>(path, { method: "PATCH", body })).data,
};
