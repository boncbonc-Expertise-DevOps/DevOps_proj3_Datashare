import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { apiMe, getToken, logout, type Me } from "./api";

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { MySpacePage } from "./pages/MySpacePage";

export default function App() {
  const [me, setMe] = useState<Me | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Au démarrage: si token => /myspace sinon rester où on est
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    apiMe()
      .then((m) => {
        setMe(m);
        // si on est sur /login ou /register, on peut rediriger vers /myspace
        if (location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/") {
          navigate("/myspace", { replace: true });
        }
      })
      .catch(() => {
        logout();
        setMe(null);
        navigate("/login", { replace: true });
      });
  }, []);

  function handleLogout() {
    logout();
    setMe(null);
    navigate("/login", { replace: true });
  }

  const isAuthed = !!getToken();

  return (
    <div className="ds-page">
      <header className="ds-header">
        <div className="ds-brand" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          DataShare
        </div>

        {isAuthed ? (
          <button className="ds-cta" onClick={handleLogout}>Déconnexion</button>
        ) : (
          <button className="ds-cta" onClick={() => navigate("/login")}>Se connecter</button>
        )}
      </header>

      <main className="ds-main">
        <Routes>
          <Route
            path="/"
            element={
              <div className="ds-landing">
                <h1>DataShare</h1>
                <p>« Nous gardons vos fichiers en toute sécurité »</p>
              </div>
            }
          />

          <Route
            path="/login"
            element={
              <LoginPage
                goRegister={() => navigate("/register")}
                onLoggedIn={async () => {
                  const m = await apiMe();
                  setMe(m);
                  navigate("/myspace", { replace: true });
                }}
              />
            }
          />

          <Route
            path="/register"
            element={<RegisterPage goLogin={() => navigate("/login")} />}
          />

          <Route
            path="/myspace"
            element={<RequireAuth><MySpacePage /></RequireAuth>}
          />

          <Route path="*" element={<div className="ds-card">404</div>} />
        </Routes>
      </main>

      <footer className="ds-footer">Copyright DataShare® 2025</footer>
    </div>
  );
}

// protège /myspace
function RequireAuth({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!getToken()) navigate("/login", { replace: true });
  }, [navigate]);
  return <>{children}</>;
}
