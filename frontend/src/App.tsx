import { useEffect, useState } from "react";
import { getToken, logout } from "./api";

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

type View = "landing" | "login" | "register" | "home";

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (token) {
      // si tu veux afficher l'email, il faudrait le décoder ou appeler /me
      setView("home");
    }
  }, []);

  function handleLogout() {
    logout();
    setUserEmail(null);
    setView("landing");
  }

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
          <LoginPage
            goRegister={() => setView("register")}
            onLoggedIn={() => {
              // Optionnel : si tu veux afficher l'email, stocke-le dans localStorage dans api.ts
              // ou ajoute une route /api/auth/me.
              setView("home");
            }}
          />
        )}

        {view === "register" && (
          <RegisterPage goLogin={() => setView("login")} />
        )}

        {view === "home" && (
          <div className="ds-card">
            <h2 className="ds-title">Mon espace</h2>
            <p>Connecté : {userEmail ?? "(email non chargé)"}</p>
          </div>
        )}
      </main>

      <footer className="ds-footer">Copyright DataShare® 2025</footer>
    </div>
  );
}
