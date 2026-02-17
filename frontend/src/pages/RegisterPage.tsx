import { useState } from "react";
import { Layout } from "../components/Layout";
import { register } from "../api";

export function RegisterPage({ goLogin }: { goLogin: () => void }) {
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
      goLogin(); // après register -> retour login
    } catch (err: any) {
      setError(err.message || "Erreur register");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout ctaLabel="Se connecter" onCtaClick={goLogin}>
      <form className="ds-card" onSubmit={onSubmit}>
        <h1 className="ds-title">Créer un compte</h1>

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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="ds-field">
          <label className="ds-label">Verification du mot de passe</label>
          <input
            className="ds-input"
            placeholder="Saisissez le à nouveau"
            type="password"
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
    </Layout>
  );
}
