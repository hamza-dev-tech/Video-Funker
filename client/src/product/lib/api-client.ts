import { API_BASE } from '@product/config';

const TOKEN_KEY = 'saleslights_token';
const USER_KEY = 'saleslights_user';

export interface ApiUser {
  _id: string;
  email: string;
  displayName?: string;
  avatarPath?: string | null;
  role: string;
  emailVerified?: boolean;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser(): ApiUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function setStoredUser(user: ApiUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export class ApiError extends Error {
  code?: string;
  status: number;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  /*
    Parse defensively, and never let a parse failure become the error message.

    This used to be `await res.json()` on the first line, before res.ok was
    consulted. Anything that is not JSON — an nginx 502 page, a gateway timeout,
    a proxy's HTML error — threw a SyntaxError inside the parse, so the user saw
    a toast reading:

        Unexpected token '<', "<html>..." is not valid JSON

    That is a description of our parser's disappointment, not of what happened
    to their request. The status code is the thing that actually knows.
  */
  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    body = null;
  }

  if (!res.ok || !body?.success) {
    throw new ApiError(
      body?.error || httpMessage(res.status),
      res.status,
      body?.code
    );
  }
  return body.data as T;
}

/**
 * A sentence a person can act on, for when the server sent no usable body.
 *
 * The fallback was `Request failed (500)`, which tells someone who is not a
 * developer nothing at all and offers no next step.
 */
export function httpMessage(status: number): string {
  if (status === 0) return "Can't reach the server. Check your connection and try again.";
  if (status === 401) return 'Your session has expired. Sign in again to continue.';
  if (status === 403) return "You don't have access to that.";
  if (status === 404) return "That doesn't exist any more.";
  if (status === 413) return 'That file is too large.';
  if (status === 429) return 'Too many requests. Wait a moment and try again.';
  if (status >= 500) return 'The server had a problem. Try again in a moment.';
  return `Something went wrong (${status}).`;
}

/**
 * Wraps fetch so a dead network reads like a sentence.
 *
 * When the server cannot be reached at all, fetch rejects with a TypeError
 * whose message is the browser's own wording — "Failed to fetch" in Chrome,
 * "Load failed" in Safari, "NetworkError when attempting to fetch resource" in
 * Firefox. That string was going straight into the UI, so an outage showed the
 * user three different messages depending on their browser, none of which say
 * what happened or what to do.
 */
async function request(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new ApiError(
      "Can't reach the server. Check your connection and try again.",
      0
    );
  }
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await request(`${API_BASE}${path}`, { headers: authHeaders() });
  return handleResponse<T>(res);
}

export async function apiPost<T = any>(path: string, body?: any): Promise<T> {
  const res = await request(`${API_BASE}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiPut<T = any>(path: string, body?: any): Promise<T> {
  const res = await request(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiPatch<T = any>(path: string, body?: any): Promise<T> {
  const res = await request(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiDelete<T = any>(path: string, body?: any): Promise<T> {
  const res = await request(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiUpload<T = any>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // Don't set Content-Type - let browser set multipart boundary
  const res = await request(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  return handleResponse<T>(res);
}
