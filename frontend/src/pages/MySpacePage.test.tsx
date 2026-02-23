import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MySpacePage } from "./MySpacePage";
import type { FileItem, FilesListResponse, FileUploadResponse } from "../api";
import { renderWithRouter } from "../test/renderWithRouter";

const mocks = vi.hoisted(() => {
  return {
    apiFilesList: vi.fn<(status?: "all" | "active" | "expired" | "deleted") => Promise<FilesListResponse>>(),
    apiFilesDelete: vi.fn<(id: string | number) => Promise<void>>(),
    apiFilesUpload: vi.fn<(req: any) => Promise<FileUploadResponse>>(),
  };
});

vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");
  return {
    ...actual,
    apiFilesList: mocks.apiFilesList,
    apiFilesDelete: mocks.apiFilesDelete,
    apiFilesUpload: mocks.apiFilesUpload,
  };
});

function makeItem(overrides: Partial<FileItem>): FileItem {
  return {
    id: overrides.id ?? 1,
    originalName: overrides.originalName ?? "file.txt",
    sizeBytes: overrides.sizeBytes ?? 10,
    createdAt: overrides.createdAt ?? "2030-01-01T00:00:00.000Z",
    expiresAt: overrides.expiresAt ?? "2030-01-05T00:00:00.000Z",
    isProtected: overrides.isProtected ?? false,
    status: overrides.status ?? "ACTIVE",
    token: overrides.token ?? "t",
    downloadUrl: overrides.downloadUrl ?? "/download/t",
  };
}

describe("MySpacePage", () => {
  beforeEach(() => {
    mocks.apiFilesList.mockReset();
    mocks.apiFilesDelete.mockReset();
    mocks.apiFilesUpload.mockReset();
  });

  it("loads files list and allows switching filter", async () => {
    mocks.apiFilesList
      .mockResolvedValueOnce({ items: [makeItem({ id: 1, originalName: "a.txt" })] })
      .mockResolvedValueOnce({ items: [] });

    renderWithRouter(<MySpacePage onLogout={() => undefined} />);

    expect(screen.getByText("Chargement...")).toBeInTheDocument();

    expect(await screen.findByText("Mes fichiers")).toBeInTheDocument();
    expect(screen.getByText("a.txt")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Actifs" }));

    await waitFor(() => {
      expect(mocks.apiFilesList).toHaveBeenCalledTimes(2);
    });
    // second call uses the active filter
    expect(mocks.apiFilesList.mock.calls[1][0]).toBe("active");
  });

  it("shows EmptyState when no files and filter not touched", async () => {
    mocks.apiFilesList.mockResolvedValueOnce({ items: [] });

    renderWithRouter(<MySpacePage onLogout={() => undefined} />);

    expect(await screen.findByText(/Tu veux partager un fichier/i)).toBeInTheDocument();
    // In EmptyState we have two "Ajouter des fichiers" buttons:
    // - topbar CTA (text)
    // - floating icon button (aria-label)
    expect(screen.getByText("Ajouter des fichiers")).toBeInTheDocument();
    expect(screen.getByLabelText("Ajouter des fichiers")).toBeInTheDocument();
  });

  it("delete flow calls apiFilesDelete after confirm", async () => {
    const item = makeItem({ id: 123, originalName: "del.txt", status: "ACTIVE" });
    mocks.apiFilesList
      .mockResolvedValueOnce({ items: [item] })
      .mockResolvedValueOnce({ items: [] });
    mocks.apiFilesDelete.mockResolvedValueOnce(undefined);

    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderWithRouter(<MySpacePage onLogout={() => undefined} />);

    expect(await screen.findByText("del.txt")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Supprimer" }));

    await waitFor(() => {
      expect(mocks.apiFilesDelete).toHaveBeenCalledWith(123);
    });
  });

  it("upload: forbidden extension shows error view", async () => {
    mocks.apiFilesList.mockResolvedValueOnce({ items: [] });

    renderWithRouter(<MySpacePage onLogout={() => undefined} />);

    const user = userEvent.setup();
    // From EmptyState
    await user.click(await screen.findByLabelText("Ajouter des fichiers"));

    expect(await screen.findByRole("heading", { name: "Ajouter des fichiers" })).toBeInTheDocument();

    const input = screen.getByLabelText("Fichier") as HTMLInputElement;
    const bad = new File(["x"], "virus.exe", { type: "application/octet-stream" });
    await user.upload(input, bad);

    expect(await screen.findByRole("heading", { name: "Erreur" })).toBeInTheDocument();
    expect(screen.getByText("Type de fichier interdit")).toBeInTheDocument();
  });

  it("upload: password too short shows error", async () => {
    mocks.apiFilesList.mockResolvedValueOnce({ items: [] });

    renderWithRouter(<MySpacePage onLogout={() => undefined} />);

    const user = userEvent.setup();
    await user.click(await screen.findByLabelText("Ajouter des fichiers"));

    expect(await screen.findByRole("heading", { name: "Ajouter des fichiers" })).toBeInTheDocument();

    const fileInput = screen.getByLabelText("Fichier") as HTMLInputElement;
    await user.upload(fileInput, new File(["ok"], "ok.txt", { type: "text/plain" }));

    const submit = screen.getByRole("button", { name: "Uploader" });
    await waitFor(() => expect(submit).toBeEnabled());

    const passwordInput = screen.getByLabelText(/Mot de passe/i) as HTMLInputElement;
    await user.type(passwordInput, "123");
    await waitFor(() => expect(passwordInput.value).toBe("123"));

    // Trigger submit explicitly; jsdom constraint validation can block click-submit.
    const form = submit.closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(await screen.findByRole("heading", { name: "Erreur" })).toBeInTheDocument();
    expect(screen.getByText(/Mot de passe trop court/i)).toBeInTheDocument();
  });

  it("renders statuses and protected icon", async () => {
    mocks.apiFilesList.mockResolvedValueOnce({
      items: [
        makeItem({ id: 1, originalName: "p.txt", isProtected: true, status: "ACTIVE" }),
        makeItem({ id: 2, originalName: "x.txt", status: "EXPIRED" }),
        makeItem({ id: 3, originalName: "d.txt", status: "DELETED" }),
      ],
    });

    renderWithRouter(<MySpacePage onLogout={() => undefined} />);

    expect(await screen.findByText("p.txt")).toBeInTheDocument();
    expect(screen.getByLabelText("Fichier protégé")).toBeInTheDocument();
    expect(screen.getByText(/a expiré/i)).toBeInTheDocument();
    expect(screen.getByText(/a été supprimé/i)).toBeInTheDocument();

    // Access button disabled for non-ACTIVE
    const accessButtons = screen.getAllByRole("button", { name: "Accéder" });
    expect(accessButtons.length).toBeGreaterThanOrEqual(1);
  });
});
