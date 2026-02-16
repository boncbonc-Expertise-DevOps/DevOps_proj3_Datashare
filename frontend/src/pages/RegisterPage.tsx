import { useState } from "react";
import { register } from "../api";

export function RegisterPage({ onGoLogin }: { onGoLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      await register({ email, password });
      setMsg("Compte créé. Tu peux te connecter.");
    } catch (err: any) {
      setMsg(err.message || "Erreur register");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>Créer un compte</h2>
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
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button disabled={loading} style={{ padding: "10px 14px" }}>
          {loading ? "Création..." : "Créer"}
        </button>

        <button type="button" onClick={onGoLogin} style={{ padding: "10px 14px", marginLeft: 10 }}>
          Jai déjà un compte
        </button>
      </form>

      {msg && <p style={{ marginTop: 14 }}>{msg}</p>}
    </div>
  );
}
