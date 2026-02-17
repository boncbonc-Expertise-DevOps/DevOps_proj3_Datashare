import { useState, useEffect } from "react";
import { login, register, getToken, logout } from "./api";

type View = "landing" | "login" | "register" | "home";

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (token) {
      setView("home");
    }
  }, []);

  /* ------------------ LOGIN ------------------ */

  async function handleLogin(email: string, password: string) {
    const res = await login({ email, password });
    setUserEmail(res.user.email);
    setView("home");
  }

  /* ------------------ REGISTER ------------------ */

  async function handleRegister(email: string, password: string) {
    await register({ email, password });
    setView("login");
  }

  /* ------------------ LOGOUT ------------------ */

  function handleLogout() {
    logout();
    setUserEmail(null);
    setView("landing");
  }

  /* ------------------ VIEWS ------------------ */

  return (
    <div className="ds-page">
      <header className="ds-header">
        <div className="ds-brand">DataShare</div>

        {view === "landing" && (
          <button className="ds-cta" onClick={() => setView("login")}>
            Se connecter
          </button>
        )}

        {view === "home" && (
          <button className="ds-cta" onClick={handleLogout}>
            Déconnexion
          </button>
        )}
      </header>

      <main className="ds-main">
        {view === "landing" && (
          <div className="ds-landing">
            <h1>DataShare</h1>
            <p>« Nous gardons vos fichiers en toute sécurité »</p>
          </div>
        )}

        {view === "login" && (
          <Login
            onLogin={handleLogin}
            onGoRegister={() => setView("register")}
          />
        )}

        {view === "register" && (
          <Register
            onRegister={handleRegister}
            onGoLogin={() => setView("login")}
          />
        )}

        {view === "home" && (
          <div className="ds-card">
            <h2 className="ds-title">Mon espace</h2>
            <p>Connecté : {userEmail}</p>
          </div>
        )}
      </main>

      <footer className="ds-footer">
        Copyright DataShare® 2025
      </footer>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function Login({
  onLogin,
  onGoRegister,
}: {
  onLogin: (email: string, password: string) => void;
  onGoRegister: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="ds-card">
      <h2 className="ds-title">Connexion</h2>

      <div className="ds-field">
        <label className="ds-label">Email</label>
        <input
          className="ds-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="ds-field">
        <label className="ds-label">Mot de passe</label>
        <input
          className="ds-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <a className="ds-link" onClick={onGoRegister}>
        Créer un compte
      </a>

      <button className="ds-primary" onClick={() => onLogin(email, password)}>
        Connexion
      </button>
    </div>
  );
}

function Register({
  onRegister,
  onGoLogin,
}: {
  onRegister: (email: string, password: string) => void;
  onGoLogin: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="ds-card">
      <h2 className="ds-title">Créer un compte</h2>

      <div className="ds-field">
        <label className="ds-label">Email</label>
        <input
          className="ds-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="ds-field">
        <label className="ds-label">Mot de passe</label>
        <input
          className="ds-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <a className="ds-link" onClick={onGoLogin}>
        J'ai déjà un compte
      </a>

      <button className="ds-primary" onClick={() => onRegister(email, password)}>
        Créer mon compte
      </button>
    </div>
  );
}
