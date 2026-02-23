import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { DownloadPage } from "./DownloadPage";
import { renderWithRouter } from "../test/renderWithRouter";

type FetchResponse = {
  ok: boolean;
  status: number;
  json?: () => Promise<unknown>;
  blob?: () => Promise<Blob>;
};

function okJson(data: unknown): FetchResponse {
  return {
    ok: true,
    status: 200,
    json: async () => data,
  };
}

function failJson(status: number, data: unknown): FetchResponse {
  return {
    ok: false,
    status,
    json: async () => data,
  };
}

function okBlob(blob: Blob): FetchResponse {
  return {
    ok: true,
    status: 200,
    blob: async () => blob,
  };
}

describe("DownloadPage", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("shows metadata and unprotected download link", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/meta")) {
        return okJson({
          token: "t123",
          originalName: "file.txt",
          mimeType: "text/plain",
          sizeBytes: 10,
          expiresAt: "2030-01-01T10:00:00.000Z",
          isProtected: false,
        }) as any;
      }
      throw new Error(`Unexpected fetch url: ${url}`);
    });
    globalThis.fetch = fetchMock as any;

    renderWithRouter(
      <Routes>
        <Route path="/download/:token" element={<DownloadPage />} />
      </Routes>,
      { route: "/download/t123" },
    );

    expect(await screen.findByText("file.txt")).toBeInTheDocument();

    const downloadLink = screen.getByRole("link", { name: "Télécharger" });
    expect(downloadLink).toHaveAttribute("href", "/api/download/t123");

    const shareInput = screen.getByLabelText("Lien de partage") as HTMLInputElement;
    expect(shareInput.value).toContain("/download/t123");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/api/download/t123/meta");
  });

  it("protected download shows password form and handles wrong password", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => okJson({
        token: "t999",
        originalName: "secret.pdf",
        mimeType: "application/pdf",
        sizeBytes: 12,
        expiresAt: "2030-01-01T10:00:00.000Z",
        isProtected: true,
      }) as any)
      .mockImplementationOnce(async () => failJson(401, { message: "Mot de passe incorrect" }) as any);

    globalThis.fetch = fetchMock as any;

    renderWithRouter(
      <Routes>
        <Route path="/download/:token" element={<DownloadPage />} />
      </Routes>,
      { route: "/download/t999" },
    );

    expect(await screen.findByText("secret.pdf")).toBeInTheDocument();

    const user = userEvent.setup();
    const passwordInput = screen.getByPlaceholderText("6 caractères minimum") as HTMLInputElement;
    const submit = screen.getByRole("button", { name: "Télécharger" });

    expect(submit).toBeDisabled();
    await user.type(passwordInput, "12345");
    expect(submit).toBeDisabled();

    await user.clear(passwordInput);
    await user.type(passwordInput, "123456");
    expect(submit).toBeEnabled();

    await user.click(submit);

    expect(await screen.findByText("Mot de passe incorrect.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("protected download success triggers a browser download", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => okJson({
        token: "tok",
        originalName: "ok.bin",
        mimeType: "application/octet-stream",
        sizeBytes: 3,
        expiresAt: "2030-01-01T10:00:00.000Z",
        isProtected: true,
      }) as any)
      .mockImplementationOnce(async () => okBlob(new Blob(["abc"], { type: "application/octet-stream" })) as any);

    globalThis.fetch = fetchMock as any;

    const createObjectURL = vi.fn(() => "blob:mock");
    const revokeObjectURL = vi.fn();
    const originalCreateObjectURL = (globalThis.URL as any).createObjectURL;
    const originalRevokeObjectURL = (globalThis.URL as any).revokeObjectURL;
    (globalThis.URL as any).createObjectURL = createObjectURL;
    (globalThis.URL as any).revokeObjectURL = revokeObjectURL;

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    renderWithRouter(
      <Routes>
        <Route path="/download/:token" element={<DownloadPage />} />
      </Routes>,
      { route: "/download/tok" },
    );

    expect(await screen.findByText("ok.bin")).toBeInTheDocument();

    const user = userEvent.setup();
    const passwordInput = screen.getByPlaceholderText("6 caractères minimum") as HTMLInputElement;
    await user.type(passwordInput, "123456");

    await user.click(screen.getByRole("button", { name: "Télécharger" }));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);

    // cleanup
    clickSpy.mockRestore();
    (globalThis.URL as any).createObjectURL = originalCreateObjectURL;
    (globalThis.URL as any).revokeObjectURL = originalRevokeObjectURL;
  });
});
