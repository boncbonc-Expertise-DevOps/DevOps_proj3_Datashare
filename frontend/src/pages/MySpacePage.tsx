import { useEffect, useState } from "react";
// import { apiFilesList } from "../api";
import { apiFilesUpload, type FileItem, type FileUploadResponse } from "../api";

export function MySpacePage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FileItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [expirationDays, setExpirationDays] = useState<number>(7);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<FileUploadResponse | null>(null);

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
    setError(null);
  }, []);

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
    setError(null);
    setUploadResult(null);

    if (!selectedFile) {
      setError("Aucun fichier sélectionné");
      return;
    }

    const localValidation = validateSelectedFile(selectedFile);
    if (localValidation) {
      setError(localValidation);
      return;
    }

    if (expirationDays < 1 || expirationDays > 7) {
      setError("Date d'expiration : 1 à 7 jours");
      return;
    }

    if (password && password.length < 6) {
      setError("Mot de passe trop court (min 6 caractères)");
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
      setError(e?.message || "Erreur upload");
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

  if (error) {
    return (
      <div className="ds-card">
        <h2 className="ds-title">Mon espace</h2>
        <div className="ds-error">{error}</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="ds-card">
        <h2 className="ds-title">Mon espace</h2>

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
                setError(null);
                setUploadResult(null);
                setSelectedFile(null);
                if (!f) return;
                const msg = validateSelectedFile(f);
                if (msg) {
                  setError(msg);
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

          {error && <div className="ds-error mt-3">{error}</div>}

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
              </div>
            </div>
          )}
        </form>

        <div className="mt-8">
          <h3 className="text-lg font-semibold">Mes fichiers</h3>
          <p className="opacity-80">(Liste à implémenter — GET /api/files)</p>
        </div>
      </div>
    );
  }

  return <FilesList items={items} />;
}

function FilesList({ items }: { items: FileItem[] }) {
  return (
    <div className="ds-card">
      <h2 className="ds-title">Mes fichiers</h2>
      <p>(Liste à implémenter — {items.length} fichier(s))</p>
    </div>
  );
}
