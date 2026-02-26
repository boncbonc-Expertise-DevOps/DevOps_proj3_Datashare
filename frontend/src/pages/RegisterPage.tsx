import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiMe, login, register } from "../api";

export function RegisterPage({ goLogin }: { goLogin: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== password2) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await register({ email, password });
      // Auto-login puis redirection vers /myspace
      await login({ email, password });
      await apiMe();
      navigate("/myspace", { replace: true });
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="ds-card" onSubmit={onSubmit}>
      <h2 className="ds-title">Créer un compte</h2>

      <div className="ds-field">
        <label className="ds-label">Email</label>
        <input
          className="ds-input"
          type="email"
          placeholder="Saisissez votre email..."
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="ds-field">
        <label className="ds-label">Mot de passe</label>
        <input
          className="ds-input"
          type="password"
          placeholder="Saisissez votre mot de passe..."
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="ds-field">
        <label className="ds-label">Vérification du mot de passe</label>
        <input
          className="ds-input"
          type="password"
          placeholder="Saisissez-le à nouveau"
          required
          minLength={8}
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
        />
      </div>

      <a
        className="ds-link"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          goLogin();
        }}
      >
        J'ai déjà un compte
      </a>

      <button className="ds-primary" type="submit" disabled={loading}>
        {loading ? "Création..." : "Créer mon compte"}
      </button>

      {error && <div className="ds-error">{error}</div>}
    </form>
  );
}
