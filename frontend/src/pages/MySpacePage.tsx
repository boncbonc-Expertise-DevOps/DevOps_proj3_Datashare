import { useEffect, useState } from "react";
// import { apiFilesList } from "../api";
import { apiFilesUpload, type FileItem, type FileUploadResponse } from "../api";

export function MySpacePage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FileItem[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);

  // UI state: on n'a pas encore GET /api/files, donc on gère l'affichage localement.
  const [view, setView] = useState<"empty" | "upload" | "error">("empty");

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [expirationDays, setExpirationDays] = useState<number>(7);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<FileUploadResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

/* code a remplacer quand GET /api/files sera dispo
useEffect(() => {
  let mounted = true;

  (async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await apiFilesList("all");
      if (!mounted) return;
      setItems(res.items || []);
    } catch (e: any) {
      if (!mounted) return;
      setError(e?.message || "Erreur chargement fichiers");
    } finally {
      if (!mounted) return;
      setLoading(false);
    }
  })();

  return () => {
    mounted = false;
  };
}, []);
*/


  useEffect(() => {
    // TODO: activer quand le backend aura GET /api/files
    setItems([]); // état vide
    setLoading(false);
    setPageError(null);
  }, []);

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
    setView("empty");
  }

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
    } catch (e: any) {
      setUploadError(e?.message || "Erreur upload");
      setView("error");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="ds-card">
        <h2 className="ds-title">Mon espace</h2>
        <p>Chargement...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <ErrorState message={pageError} onBack={goBackToMySpace} />
    );
  }

  // Toujours afficher une page d'erreur dédiée (comme les autres pages)
  if (view === "error") {
    return (
      <ErrorState
        message={uploadError ?? "Erreur"}
        onBack={goBackToMySpace}
      />
    );
  }

  // Tant que GET /api/files n'existe pas, on force l'expérience "empty" -> "upload".
  if (items.length === 0) {
    if (view === "empty") {
      return (
        <EmptyState
          onGoUpload={() => {
            resetUploadState();
            setView("upload");
          }}
        />
      );
    }

    return (
      <div className="ds-card">
        <h2 className="ds-title">Uploader un fichier</h2>

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
    );
  }

  return <FilesList items={items} />;
}

function EmptyState({ onGoUpload }: { onGoUpload: () => void }) {
  return (
    <div className="ds-myspace-empty">
      <div className="ds-myspace-empty-text">Tu veux partager un fichier ?</div>

      <button
        className="ds-upload-btn"
        onClick={onGoUpload}
        aria-label="Uploader un fichier"
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

function FilesList({ items }: { items: FileItem[] }) {
  return (
    <div className="ds-card">
      <h2 className="ds-title">Mes fichiers</h2>
      <p>(Liste à implémenter — {items.length} fichier(s))</p>
    </div>
  );
}
