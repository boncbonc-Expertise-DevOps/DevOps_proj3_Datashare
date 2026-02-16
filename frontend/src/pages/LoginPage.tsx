import { useState } from "react";
import { login } from "../api";

export function LoginPage({
  onLoggedIn,
  onGoRegister,
}: {
  onLoggedIn: () => void;
  onGoRegister: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      await login({ email, password });
      onLoggedIn();
    } catch (err: any) {
      setMsg(err.message || "Erreur login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>Connexion</h2>
      <form onSubmit={submit}>
        <label>Email</label>
        <input
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Mot de passe</label>
        <input
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button disabled={loading} style={{ padding: "10px 14px" }}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        <button type="button" onClick={onGoRegister} style={{ padding: "10px 14px", marginLeft: 10 }}>
          Créer un compte
        </button>
      </form>

      {msg && <p style={{ marginTop: 14 }}>{msg}</p>}
    </div>
  );
}
