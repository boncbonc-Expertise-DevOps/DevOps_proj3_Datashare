import { useEffect, useState } from "react";
import { apiMe, getToken, logout, type Me } from "./api";

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { MySpacePage } from "./pages/MySpacePage";

type View = "landing" | "login" | "register" | "myspace";

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [me, setMe] = useState<Me | null>(null);

  // Au démarrage : si token déjà présent, on essaie /me
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    apiMe()
      .then((m) => {
        setMe(m);
        setView("myspace");
      })
      .catch(() => {
        logout();
        setView("landing");
      });
  }, []);

  function handleLogout() {
    logout();
    setMe(null);
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

        {view === "myspace" && (
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
            onLoggedIn={async () => {
              const m = await apiMe();
              setMe(m);
              setView("myspace");
            }}
          />
        )}

        {view === "register" && (
          <RegisterPage goLogin={() => setView("login")} />
        )}

        {view === "myspace" && <MySpacePage />}
      </main>

      <footer className="ds-footer">Copyright DataShare® 2025</footer>
    </div>
  );
}
