export type RegisterRequest = { email: string; password: string };
export type RegisterResponse = { id: string; email: string };

export type LoginRequest = { email: string; password: string };
export type LoginResponse = {
  accessToken: string;
  user: { id: number | string; email: string };
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

export function logout() {
  setToken(null);
}
