import { useEffect, useState } from "react";
import { apiFilesList } from "../api";
import type { FileItem } from "../api";

export function MySpacePage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FileItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  /* Commenté jusqu'a ce que api/files soit fonctionnel en backend
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setError(null);
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
  // Forcer liste vide
  setItems([]);
  setLoading(false);
}, []);

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
    return <EmptyState onUpload={() => alert("TODO: écran Ajouter un fichier")} />;
  }

  return <FilesList items={items} />;
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="ds-myspace-empty">
      <div className="ds-myspace-empty-text">Tu veux partager un fichier ?</div>

      <button className="ds-upload-btn" onClick={onUpload} aria-label="Uploader un fichier">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M12 16V5" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M8 9L12 5L16 9"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M4 19H20" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
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
