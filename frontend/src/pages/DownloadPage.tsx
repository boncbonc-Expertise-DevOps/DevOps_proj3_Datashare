import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type DownloadMeta = {
  token: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  expiresAt: string;
  isProtected: boolean;
};

function formatBytes(sizeBytes: number) {
  if (!Number.isFinite(sizeBytes)) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = sizeBytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  const value = i === 0 ? String(Math.round(n)) : n.toFixed(1);
  return `${value} ${units[i]}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function friendlyErrorMessage(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (lower.includes("token") && lower.includes("invalide")) return "Lien invalide.";
  if (lower.includes("expir")) return "Lien expiré.";
  if (lower.includes("supprim")) return "Fichier supprimé.";
  return msg || "Erreur lors du chargement.";
}

export function DownloadPage() {
  const navigate = useNavigate();
  const { token } = useParams();

  const [meta, setMeta] = useState<DownloadMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const metaUrl = useMemo(() => {
    if (!token) return null;
    return `/api/download/${encodeURIComponent(token)}/meta`;
  }, [token]);

  const downloadUrl = useMemo(() => {
    if (!token) return null;
    return `/api/download/${encodeURIComponent(token)}`;
  }, [token]);

  const shareUrl = useMemo(() => {
    if (!token) return "";
    try {
      return `${window.location.origin}/download/${encodeURIComponent(token)}`;
    } catch {
      return `/download/${encodeURIComponent(token)}`;
    }
  }, [token]);

  useEffect(() => {
    if (!metaUrl) {
      setError("Lien invalide.");
      setLoading(false);
      return;
    }

    const ac = new AbortController();
    setLoading(true);
    setError(null);

    fetch(metaUrl, { method: "GET", signal: ac.signal })
      .then(async (res) => {
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const data = await res.json();
            msg = data?.message || msg;
          } catch {}
          throw new Error(msg);
        }
        return (await res.json()) as DownloadMeta;
      })
      .then((data) => {
        setMeta(data);
        setDownloadError(null);
        setLoading(false);
      })
      .catch((e) => {
        if (ac.signal.aborted) return;
        setMeta(null);
        setError(friendlyErrorMessage(e));
        setLoading(false);
      });

    return () => ac.abort();
  }, [metaUrl]);

  const canSubmitProtected = !!password && password.length >= 6;

  async function handleProtectedDownload(e: React.FormEvent) {
    e.preventDefault();
    if (!downloadUrl) return;
    setDownloadError(null);
    setDownloading(true);

    try {
      const res = await fetch(downloadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const data = await res.json();
          msg = data?.message || msg;
        } catch {}

        const lower = String(msg).toLowerCase();
        if (res.status === 401 && lower.includes("mot de passe")) {
          throw new Error("Mot de passe incorrect.");
        }
        if (res.status === 410) {
          throw new Error("Lien expiré ou fichier supprimé.");
        }
        if (res.status === 404) {
          throw new Error("Lien invalide.");
        }
        throw new Error(String(msg));
      }

      const blob = await res.blob();
      const filename = meta?.originalName || "download";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setDownloadError(msg || "Erreur lors du téléchargement.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="ds-card">
      <h1 className="ds-title">Téléchargement</h1>

      {loading && <div className="ds-center-text">Chargement...</div>}

      {!loading && error && (
        <div>
          <div className="ds-error">{error}</div>
          <button className="ds-link" onClick={() => navigate("/")}>Retour</button>
        </div>
      )}

      {!loading && !error && meta && (
        <div>
          <div className="ds-field">
            <label className="ds-label" htmlFor="ds-share-link">Lien de partage</label>
            <input
              className="ds-input"
              id="ds-share-link"
              value={shareUrl}
              readOnly
              title="Lien de téléchargement à partager"
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>

          <div className="ds-field">
            <span className="ds-label">Nom du fichier</span>
            <div className="ds-input ds-input-row">
              {meta.originalName}
            </div>
          </div>

          <div className="ds-field">
            <span className="ds-label">Taille</span>
            <div className="ds-input ds-input-row">
              {formatBytes(meta.sizeBytes)}
            </div>
          </div>

          <div className="ds-field">
            <span className="ds-label">Type</span>
            <div className="ds-input ds-input-row">
              {meta.mimeType}
            </div>
          </div>

          <div className="ds-field">
            <span className="ds-label">Expiration</span>
            <div className="ds-input ds-input-row">
              {formatDate(meta.expiresAt)}
            </div>
          </div>

          {!meta.isProtected && downloadUrl && (
            <a className="ds-primary ds-primary-link" href={downloadUrl}>
              Télécharger
            </a>
          )}

          {meta.isProtected && downloadUrl && (
            <form onSubmit={handleProtectedDownload}>
              <div className="ds-field ds-mt-16">
                <label className="ds-label">Mot de passe</label>
                <input
                  className="ds-input"
                  type="password"
                  placeholder="6 caractères minimum"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              {downloadError && <div className="ds-error">{downloadError}</div>}

              <button className="ds-primary" type="submit" disabled={!canSubmitProtected || downloading}>
                {downloading ? "Téléchargement..." : "Télécharger"}
              </button>
            </form>
          )}

          <button className="ds-link" onClick={() => navigate("/")}>Retour</button>
        </div>
      )}
    </div>
  );
}
