import { useEffect, useState } from "react";
import { apiFilesList, apiFilesUpload, type FileItem, type FileUploadResponse } from "../api";

export function MySpacePage({ onLogout }: { onLogout: () => void }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FileItem[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);

  const [view, setView] = useState<"list" | "upload" | "error">("list");
  const [filter, setFilter] = useState<"all" | "active" | "expired" | "deleted">("all");
  const [hasTouchedFilter, setHasTouchedFilter] = useState(false);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [expirationDays, setExpirationDays] = useState<number>(7);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<FileUploadResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function refreshFiles(nextFilter: typeof filter = filter) {
    const res = await apiFilesList(nextFilter);
    setItems(res.items || []);
    return res.items || [];
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setPageError(null);
        setLoading(true);
        const res = await apiFilesList(filter);
        if (!mounted) return;
        const next = res.items || [];
        setItems(next);
        setView("list");
      } catch (e: any) {
        if (!mounted) return;
        setPageError(e?.message || "Erreur chargement fichiers");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [filter]);

  function resetUploadState() {
    setSelectedFile(null);
    setPassword("");
    setExpirationDays(7);
    setUploading(false);
    setUploadResult(null);
    setUploadError(null);
  }

  function goBackToMySpace() {
    setPageError(null);
    resetUploadState();
    setView("list");
  }

  async function handleGoFiles() {
    // "Mes fichiers" agit comme un refresh et remet le filtre sur Tous
    setView("list");
    setHasTouchedFilter(false);
    setFilter("all");
    try {
      setPageError(null);
      setLoading(true);
      const next = await refreshFiles("all");
      setItems(next);
    } catch (e: any) {
      setPageError(e?.message || "Erreur chargement fichiers");
    } finally {
      setLoading(false);
    }
  }

  const showEmptySpace = !hasTouchedFilter && filter === "all" && items.length === 0;

  const forbiddenExt = new Set([
    ".exe",
    ".bat",
    ".cmd",
    ".sh",
    ".msi",
    ".com",
    ".scr",
    ".pif",
    ".cpl",
  ]);

  function validateSelectedFile(file: File): string | null {
    const name = file.name || "";
    const idx = name.lastIndexOf(".");
    const ext = idx >= 0 ? name.slice(idx).toLowerCase() : "";
    if (!ext) return "Fichier sans extension interdit";
    if (forbiddenExt.has(ext)) return "Type de fichier interdit";
    return null;
  }

  async function onUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploadError(null);
    setUploadResult(null);

    if (!selectedFile) {
      setUploadError("Aucun fichier sélectionné");
      setView("error");
      return;
    }

    const localValidation = validateSelectedFile(selectedFile);
    if (localValidation) {
      setUploadError(localValidation);
      setView("error");
      return;
    }

    if (expirationDays < 1 || expirationDays > 7) {
      setUploadError("Date d'expiration : 1 à 7 jours");
      setView("error");
      return;
    }

    if (password && password.length < 6) {
      setUploadError("Mot de passe trop court (min 6 caractères)");
      setView("error");
      return;
    }

    setUploading(true);
    try {
      const res = await apiFilesUpload({
        file: selectedFile,
        password: password || undefined,
        expiration_days: expirationDays,
      });
      setUploadResult(res);
      // refresh list after successful upload
      try {
        const next = await refreshFiles(filter);
        setItems(next);
        setView("list");
      } catch {
        // ignore refresh errors here; user can retry later
      }
    } catch (e: any) {
      setUploadError(e?.message || "Erreur upload");
      setView("error");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <MySpaceShell onLogout={onLogout} onGoFiles={handleGoFiles}><div>Chargement...</div></MySpaceShell>;
  }

  if (pageError) {
    return <MySpaceShell onLogout={onLogout} onGoFiles={handleGoFiles}><ErrorState message={pageError} onBack={goBackToMySpace} /></MySpaceShell>;
  }

  // Toujours afficher une page d'erreur dédiée (comme les autres pages)
  if (view === "error") {
    return <MySpaceShell onLogout={onLogout} onGoFiles={handleGoFiles}><ErrorState message={uploadError ?? "Erreur"} onBack={goBackToMySpace} /></MySpaceShell>;
  }

  if (view === "upload") {
    return (
      <MySpaceShell onLogout={onLogout} onGoFiles={handleGoFiles}>
        <div className="ds-card ds-myspace-upload-card">
          <h2 className="ds-title">Ajouter des fichiers</h2>

        <form onSubmit={onUploadSubmit} className="mt-4">
          <div className="ds-field">
            <label className="ds-label" htmlFor="ds-upload-file">Fichier</label>
            <input
              className="ds-input"
              id="ds-upload-file"
              type="file"
              required
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setUploadError(null);
                setUploadResult(null);
                setSelectedFile(null);
                if (!f) return;
                const msg = validateSelectedFile(f);
                if (msg) {
                  setUploadError(msg);
                  setView("error");
                  return;
                }
                setSelectedFile(f);
              }}
            />
          </div>

          <div className="ds-field">
            <label className="ds-label" htmlFor="ds-upload-expiration">Expiration (jours)</label>
            <input
              className="ds-input"
              id="ds-upload-expiration"
              type="number"
              min={1}
              max={7}
              value={expirationDays}
              onChange={(e) => setExpirationDays(Number(e.target.value))}
            />
          </div>

          <div className="ds-field">
            <label className="ds-label" htmlFor="ds-upload-password">Mot de passe (optionnel)</label>
            <input
              className="ds-input"
              id="ds-upload-password"
              type="password"
              placeholder="Min 6 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="ds-primary" type="submit" disabled={uploading || !selectedFile}>
            {uploading ? "Upload..." : "Uploader"}
          </button>

          <p className="mt-3 text-sm opacity-80">
            Taille max 1 Go. Extensions interdites : .exe, .bat, etc. Fichiers sans extension refusés.
          </p>

          {uploadResult && (
            <div className="mt-4">
              <div className="font-semibold">Upload OK</div>
              <div className="mt-2 text-sm">
                <div>Nom : {uploadResult.originalName}</div>
                <div>Expire le : {uploadResult.expiresAt}</div>
                <div>
                  Lien :{" "}
                  <a className="ds-link" href={uploadResult.downloadUrl}>
                    {uploadResult.downloadUrl}
                  </a>
                </div>
                <div>Token : {uploadResult.token}</div>
                <div>Protégé : {uploadResult.isProtected ? "oui" : "non"}</div>
              </div>

              <button
                type="button"
                className="ds-cta mt-4"
                onClick={() => {
                  goBackToMySpace();
                }}
              >
                Retour à mon espace
              </button>
            </div>
          )}
        </form>
        </div>
      </MySpaceShell>
    );
  }

  return (
    <MySpaceShell
      onLogout={onLogout}
      onGoFiles={handleGoFiles}
      onAddFiles={() => {
        resetUploadState();
        setView("upload");
      }}
    >
      {showEmptySpace ? (
        <EmptyState
          onGoUpload={() => {
            resetUploadState();
            setView("upload");
          }}
        />
      ) : (
        <FilesList
          items={items}
          filter={filter}
          onFilterChange={(f) => {
            setHasTouchedFilter(true);
            setFilter(f);
          }}
          onGoUpload={() => {
            resetUploadState();
            setView("upload");
          }}
        />
      )}
    </MySpaceShell>
  );
}

function EmptyState({ onGoUpload }: { onGoUpload: () => void }) {
  return (
    <div className="ds-myspace-empty">
      <div className="ds-myspace-empty-text">Tu veux partager un fichier ?</div>

      <button
        className="ds-upload-btn"
        onClick={onGoUpload}
        aria-label="Ajouter des fichiers"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 16V5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M8 9L12 5L16 9"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 19H20"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

function MySpaceShell({
  children,
  onLogout,
  onAddFiles,
  onGoFiles,
}: {
  children: React.ReactNode;
  onLogout: () => void;
  onAddFiles?: () => void;
  onGoFiles?: () => void;
}) {
  return (
    <div className="ds-myspace-layout">
      <aside className="ds-myspace-sidebar">
        <div className="ds-myspace-sidebar-brand">DataShare</div>
        <div className="ds-myspace-nav">
          <button className="ds-myspace-nav-item is-active" type="button" onClick={onGoFiles}>
            Mes fichiers
          </button>
        </div>
        <div className="ds-myspace-sidebar-footer">Copyright DataShare® 2025</div>
      </aside>

      <section className="ds-myspace-content">
        <div className="ds-myspace-topbar">
          {onAddFiles && (
            <button className="ds-cta" type="button" onClick={onAddFiles}>
              Ajouter des fichiers
            </button>
          )}
          <button className="ds-myspace-logout" type="button" onClick={onLogout}>
            Déconnexion
          </button>
        </div>

        <div className="ds-myspace-body">{children}</div>
      </section>
    </div>
  );
}

function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="ds-card">
      <h2 className="ds-title">Erreur</h2>
      <div className="ds-error">{message}</div>
      <button type="button" className="ds-cta mt-4" onClick={onBack}>
        Retour à mon espace
      </button>
    </div>
  );
}

function FilesList({
  items,
  filter,
  onFilterChange,
  onGoUpload,
}: {
  items: FileItem[];
  filter: "all" | "active" | "expired" | "deleted";
  onFilterChange: (f: "all" | "active" | "expired" | "deleted") => void;
  onGoUpload: () => void;
}) {
  return (
    <div>
      <h1 className="ds-myspace-title">Mes fichiers</h1>

      <div className="ds-tabs">
        <button
          className={`ds-tab ${filter === "all" ? "is-active" : ""}`}
          type="button"
          onClick={() => onFilterChange("all")}
        >
          Tous
        </button>
        <button
          className={`ds-tab ${filter === "active" ? "is-active" : ""}`}
          type="button"
          onClick={() => onFilterChange("active")}
        >
          Actifs
        </button>
        <button
          className={`ds-tab ${filter === "expired" ? "is-active" : ""}`}
          type="button"
          onClick={() => onFilterChange("expired")}
        >
          Expirés
        </button>
        <button
          className={`ds-tab ${filter === "deleted" ? "is-active" : ""}`}
          type="button"
          onClick={() => onFilterChange("deleted")}
        >
          Effacés
        </button>
      </div>

      <div className="ds-file-list">
        {items.map((it) => (
          <FileRow key={String(it.id)} item={it} />
        ))}

        {items.length === 0 && (
          <div className="opacity-80 text-sm">Aucun fichier.</div>
        )}
      </div>

      <div className="mt-4">
        <button className="ds-primary" type="button" onClick={onGoUpload}>
          Ajouter des fichiers
        </button>
      </div>
    </div>
  );
}

function FileRow({ item }: { item: FileItem }) {
  const expText = formatExpiration(item);
  const sentText = formatSentAt(item.createdAt);
  const canAccess = item.status === "ACTIVE";

  return (
    <div className="ds-file-row">
      <div className="ds-file-left">
        <div className="ds-file-icon" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" stroke="rgba(0,0,0,.55)" strokeWidth="2" />
            <path d="M14 2v6h6" stroke="rgba(0,0,0,.55)" strokeWidth="2" />
          </svg>
        </div>

        <div className="ds-file-meta">
          <div className="ds-file-name">{item.originalName}</div>
          <div className="ds-file-sub">
            <span className={item.status !== "ACTIVE" ? "is-bad" : undefined}>{expText}</span>
            <span> · {sentText}</span>
          </div>
          {(item.status === "EXPIRED" || item.status === "DELETED") && (
            <div className="ds-file-sub">
              Ce fichier {item.status === "EXPIRED" ? "a expiré" : "a été supprimé"}, il n'est plus stocké chez nous
            </div>
          )}
        </div>
      </div>

      <div className="ds-file-right">
        {item.isProtected && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-label="Fichier protégé">
            <path d="M17 11V8a5 5 0 0 0-10 0v3" stroke="rgba(0,0,0,.55)" strokeWidth="2" strokeLinecap="round" />
            <path d="M7 11h10v10H7z" stroke="rgba(0,0,0,.55)" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        )}

        <button className="ds-mini-btn" type="button" disabled>
          Supprimer
        </button>

        <button
          className="ds-mini-btn is-ghost"
          type="button"
          disabled={!canAccess}
          onClick={() => {
            if (!canAccess) return;
            window.location.href = item.downloadUrl;
          }}
        >
          Accéder
        </button>
      </div>
    </div>
  );
}

function formatSentAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date d'envoi inconnue";
  const f = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `Envoyé le ${f.format(d)}`;
}

function formatExpiration(item: FileItem) {
  if (item.status === "EXPIRED") return "Expiré";
  if (item.status === "DELETED") return "Supprimé";

  const now = new Date();
  const exp = new Date(item.expiresAt);
  if (Number.isNaN(exp.getTime())) return "Expiration inconnue";

  const ms = exp.getTime() - now.getTime();
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Expire aujourd'hui";
  if (days === 1) return "Expire demain";
  return `Expire dans ${days} jours`;
}
