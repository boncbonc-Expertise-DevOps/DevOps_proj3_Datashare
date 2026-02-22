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

export type FileUploadRequest = {
  file: File;
  password?: string;
  expiration_days?: number; // 1..7
};

// Format du contrat d'interface (documentation/CONTRAT_INTERFACE.md)
export type FileUploadResponse = {
  id: string | number;
  token: string;
  downloadUrl: string;
  originalName: string;
  sizeBytes: number;
  expiresAt: string;
  isProtected: boolean;
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

// Helper pour multipart/form-data: ne jamais forcer Content-Type (le navigateur gère le boundary)
async function apiFormData<T>(url: string, formData: FormData, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, {
    ...init,
    method: init.method || "POST",
    headers,
    body: formData,
  });

  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = (body && (body.message || body.error)) || `HTTP ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return body as T;
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

export async function apiFilesUpload(req: FileUploadRequest): Promise<FileUploadResponse> {
  const fd = new FormData();
  fd.append("file", req.file);
  if (req.password) fd.append("password", req.password);
  if (typeof req.expiration_days === "number") {
    fd.append("expiration_days", String(req.expiration_days));
  }

  // Backend actuel renvoie { status, file: { downloadToken, size, passwordProtected, ... } }
  // On normalise vers le contrat { id, token, downloadUrl, originalName, sizeBytes, expiresAt, isProtected }
  const raw = await apiFormData<any>("/api/files/upload", fd, { method: "POST" });

  const file = raw?.file ?? raw;
  const token = file?.downloadToken ?? file?.token;
  const id = file?.id;
  const originalName = file?.originalName;
  const sizeBytes = file?.sizeBytes ?? file?.size;
  const expiresAt = file?.expiresAt;
  const isProtected = file?.isProtected ?? file?.passwordProtected ?? false;

  if (!token || !id || !originalName || !sizeBytes || !expiresAt) {
    throw new Error("Réponse upload inattendue");
  }

  return {
    id,
    token,
    downloadUrl: `/download/${token}`,
    originalName,
    sizeBytes,
    expiresAt,
    isProtected: Boolean(isProtected),
  };
}


export function logout() {
  setToken(null);
}
