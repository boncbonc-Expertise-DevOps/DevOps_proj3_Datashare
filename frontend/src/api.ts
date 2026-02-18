export type RegisterRequest = { email: string; password: string };
export type RegisterResponse = { id: string; email: string };

export type LoginRequest = { email: string; password: string };
export type LoginResponse = {
  accessToken: string;
  user: { id: number | string; email: string };
};

export type Me = { id: number; email: string };

export type FileItem = {
  id: string | number;
  originalName: string;
  sizeBytes: number;
  expiresAt: string;
  isProtected: boolean;
  status: "ACTIVE" | "EXPIRED";
};

export type FilesListResponse = {
  items: FileItem[];
  page?: number;
  pageSize?: number;
  total?: number;
};

export function setToken(token: string | null) {
  if (token) localStorage.setItem("accessToken", token);
  else localStorage.removeItem("accessToken");
}
export function getToken() {
  return localStorage.getItem("accessToken");
}

async function apiJson<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = (body && (body.message || body.error)) || `HTTP ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return body as T;
}

export function register(data: RegisterRequest) {
  return apiJson<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(data: LoginRequest) {
  const r = await apiJson<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setToken(r.accessToken);
  return r;
}

// --- small helper ---
async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  // 204 no-content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- endpoints ---
export function apiMe() {
  return apiFetch<Me>("/api/auth/me", { method: "GET" });
}

export function apiFilesList(status: "all" | "active" | "expired" = "all") {
  const qs = new URLSearchParams();
  qs.set("status", status);
  return apiFetch<FilesListResponse>(`/api/files?${qs.toString()}`, {
    method: "GET",
  });
}


export function logout() {
  setToken(null);
}
