// ---- Base URL (configure in .env: VITE_API_URL=http://localhost:3030) ----
export const API_BASE =
  import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim()
    ? String(import.meta.env.VITE_API_URL).trim()
    : "http://localhost:3030";

console.log("[API_BASE]", API_BASE);

const API_PREFIX = "/api/v1";

const TOKEN_KEY = "auth_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Safe join (χωρίς διπλές /)
function joinUrl(base: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  const b = base.replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "");
  return `${b}/${p}`;
}

// Χτίσε πάντα path με /api/v1 prefix
function withApiPrefix(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_PREFIX}${p}`;
}

/** Types for query params (no use of any) */
type QueryPrimitive = string | number | boolean;
type QueryValue = QueryPrimitive | ReadonlyArray<QueryPrimitive>;
export type QueryParams = Record<string, QueryValue | null | undefined>;

/** Add query params (supports keys like "$sort[date]") */
function appendParams(urlStr: string, params?: QueryParams) {
  if (!params) return urlStr;
  const url = new URL(urlStr);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) {
      v.forEach((item) => url.searchParams.append(k, String(item)));
    } else {
      url.searchParams.append(k, String(v));
    }
  });
  return url.toString();
}


type ApiInit = Omit<RequestInit, "headers" | "body"> & {
  params?: QueryParams;
  headers?: Record<string, string>;
  body?: string | FormData | Blob | ArrayBufferView | null;
};

// ---- Generic fetch wrapper (με καθαρό error handling) ----
export async function api<T>(path: string, init: ApiInit = {}): Promise<T> {
  const { params, headers: hdrs, body, ...rest } = init;
  const jwt = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(hdrs ?? {}),
    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
  };

  const baseUrl = joinUrl(API_BASE, withApiPrefix(path));
  const url = appendParams(baseUrl, params);

  let res: Response;
  try {
    res = await fetch(url, { ...rest, headers, body });
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : "Network error (possible CORS or server is down).";
    throw new Error(`Network error while fetching ${url}: ${msg}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} @ ${url}\n${text}`.trim());
  }

  try {
    return (await res.json()) as T;
  } catch {
    // π.χ. 204 No Content
    return undefined as unknown as T;
  }
}

// ---- Auth ----
export async function login(email: string, password: string) {
  type LoginResponse = {
    accessToken: string;
    tokenType: "Bearer";
    user: {
      user_id: number;
      email: string;
      role: string;
      is_active: number;
      created_at: string;
      updated_at: string;
      last_login?: string | null;
    };
  };

  const data = await api<LoginResponse>("/login/access-token", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const jwt = data?.accessToken ?? null;
  if (!jwt) throw new Error("No token returned from login.");

  setToken(jwt);
  return data.user;
}

export function logout() {
  clearToken();
}

// ---- Quick healthcheck
export async function ping(): Promise<boolean> {
  try {
    const res = await fetch(joinUrl(API_BASE, "/"), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return !!res.status;
  } catch {
    return false;
  }
}

// ---- Feathers-like service helpers ----
export type Paginated<T> = {
  data: T[];
  total?: number;
  limit?: number;
  skip?: number;
};

export const service = {
  find: <T>(name: string, query?: QueryParams) =>
    api<Paginated<T>>(`/${name}`, { params: query }),

  get: <T>(name: string, id: string | number, query?: QueryParams) =>
    api<T>(`/${name}/${id}`, { params: query }),

  create: <TResponse, TPayload = unknown>(name: string, body: TPayload) =>
    api<TResponse>(`/${name}`, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers: body instanceof FormData ? { } : undefined,
    }),

  patch: <TResponse, TPayload = unknown>(
    name: string,
    id: string | number,
    body: TPayload
  ) =>
    api<TResponse>(`/${name}/${id}`, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers: body instanceof FormData ? { } : undefined,
    }),

  remove: <T>(name: string, id: string | number) =>
    api<T>(`/${name}/${id}`, { method: "DELETE" }),
};
