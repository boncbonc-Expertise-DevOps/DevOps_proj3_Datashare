import { describe, expect, it, vi } from "vitest";
import {
  apiFilesDelete,
  apiFilesList,
  apiFilesUpload,
  apiMe,
  getToken,
  login,
  logout,
  register,
  setToken,
} from "./api";

function makeHeaders(map: Record<string, string>) {
  return {
    get: (key: string) => map[key.toLowerCase()] ?? map[key] ?? null,
  } as any;
}

function makeRes(opts: {
  ok: boolean;
  status: number;
  headers?: Record<string, string>;
  json?: unknown;
  text?: string;
}) {
  const headers = makeHeaders(
    Object.fromEntries(Object.entries(opts.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v])),
  );

  return {
    ok: opts.ok,
    status: opts.status,
    headers,
    json: async () => opts.json,
    text: async () => opts.text ?? (typeof opts.json === "string" ? opts.json : JSON.stringify(opts.json ?? "")),
  } as any;
}

describe("api.ts", () => {
  it("setToken/getToken/logout manipulate localStorage", () => {
    setToken("abc");
    expect(getToken()).toBe("abc");

    setToken(null);
    expect(getToken()).toBeNull();

    setToken("def");
    logout();
    expect(getToken()).toBeNull();
  });

  it("register throws a friendly error from json body", async () => {
    const fetchMock = vi.fn(async () =>
      makeRes({ ok: false, status: 409, headers: { "content-type": "application/json" }, json: { message: "Email déjà utilisé" } }),
    );
    vi.stubGlobal("fetch", fetchMock as any);

    await expect(register({ email: "a@b.c", password: "12345678" })).rejects.toThrow(/Email déjà utilisé/);
  });

  it("login stores the access token", async () => {
    const fetchMock = vi.fn(async () =>
      makeRes({
        ok: true,
        status: 200,
        headers: { "content-type": "application/json" },
        json: { accessToken: "tok", user: { id: 1, email: "a@b.c" } },
      }),
    );
    vi.stubGlobal("fetch", fetchMock as any);

    await login({ email: "a@b.c", password: "pw" });
    expect(getToken()).toBe("tok");
  });

  it("apiMe sends Authorization header when token is set", async () => {
    setToken("jwt123");

    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const h = new Headers(init.headers);
      expect(h.get("Authorization")).toBe("Bearer jwt123");
      return makeRes({ ok: true, status: 200, headers: { "content-type": "application/json" }, json: { id: 1, email: "a@b.c" } });
    });
    vi.stubGlobal("fetch", fetchMock as any);

    const me = await apiMe();
    expect(me.email).toBe("a@b.c");
  });

  it("apiFilesList builds status querystring", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toContain("/api/files?");
      expect(url).toContain("status=active");
      return makeRes({ ok: true, status: 200, headers: { "content-type": "application/json" }, json: { items: [] } });
    });
    vi.stubGlobal("fetch", fetchMock as any);

    const res = await apiFilesList("active");
    expect(res.items).toEqual([]);
  });

  it("apiFilesUpload normalizes backend response and does not force Content-Type", async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const h = new Headers(init.headers);
      // should be null because browser sets multipart boundary
      expect(h.get("Content-Type")).toBeNull();

      return makeRes({
        ok: true,
        status: 201,
        headers: { "content-type": "application/json" },
        json: {
          file: {
            id: 10,
            downloadToken: "uuid-token",
            originalName: "ok.txt",
            size: 3,
            expiresAt: "2030-01-01T00:00:00.000Z",
            passwordProtected: true,
          },
        },
      });
    });
    vi.stubGlobal("fetch", fetchMock as any);

    const file = new File(["abc"], "ok.txt", { type: "text/plain" });
    const r = await apiFilesUpload({ file, password: "123456", expiration_days: 7 });

    expect(r).toEqual({
      id: 10,
      token: "uuid-token",
      downloadUrl: "/download/uuid-token",
      originalName: "ok.txt",
      sizeBytes: 3,
      expiresAt: "2030-01-01T00:00:00.000Z",
      isProtected: true,
    });
  });

  it("apiFilesDelete returns undefined for 204", async () => {
    const fetchMock = vi.fn(async () => makeRes({ ok: true, status: 204, headers: { "content-length": "0" } }));
    vi.stubGlobal("fetch", fetchMock as any);

    await expect(apiFilesDelete(123)).resolves.toBeUndefined();
  });
});
