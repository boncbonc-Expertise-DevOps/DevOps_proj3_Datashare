import { useState } from "react";
import { login } from "../api";

export function LoginPage({
  goRegister,
  onLoggedIn,
}: {
  goRegister: () => void;
  onLoggedIn: () => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      await onLoggedIn();
    } catch (err: any) {
      setError(err.message || "Erreur login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="ds-card" onSubmit={onSubmit}>
      <h1 className="ds-title">Connexion</h1>

      <div className="ds-field">
        <label className="ds-label">Email</label>
        <input
          className="ds-input"
          placeholder="Saisissez votre email..."
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="ds-field">
        <label className="ds-label">Mot de passe</label>
        <input
          className="ds-input"
          placeholder="Saisissez votre mot de passe..."
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <a
        className="ds-link"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          goRegister();
        }}
      >
        Créer un compte
      </a>

      <button className="ds-primary" type="submit" disabled={loading}>
        {loading ? "Connexion..." : "Connexion"}
      </button>

      {error && <div className="ds-error">{error}</div>}
    </form>
  );
}
