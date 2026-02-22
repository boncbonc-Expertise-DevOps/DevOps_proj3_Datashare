import { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { apiMe, getToken, logout } from "./api";

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { MySpacePage } from "./pages/MySpacePage";
import { DownloadPage } from "./pages/DownloadPage";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMySpaceRoute = location.pathname.startsWith("/myspace");

  // Au démarrage: si token => /myspace sinon rester où on est
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    apiMe()
      .then(() => {
        // si on est sur /login ou /register, on peut rediriger vers /myspace
        if (location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/") {
          navigate("/myspace", { replace: true });
        }
      })
      .catch(() => {
        logout();
        navigate("/login", { replace: true });
      });
  }, []);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const isAuthed = !!getToken();

  return (
    <div className="ds-page">
      {!isMySpaceRoute && (
        <header className="ds-header">
          <div className="ds-brand ds-clickable" onClick={() => navigate("/")}> 
            DataShare
          </div>

          {isAuthed ? (
            <button className="ds-cta" onClick={handleLogout}>Déconnexion</button>
          ) : (
            <button className="ds-cta" onClick={() => navigate("/login")}>Se connecter</button>
          )}
        </header>
      )}

      <main className={`ds-main ${isMySpaceRoute ? "ds-main-myspace" : ""}`}>
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
                  await apiMe();
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
            element={<RequireAuth><MySpacePage onLogout={handleLogout} /></RequireAuth>}
          />

          <Route path="/download/:token" element={<DownloadPage />} />

          <Route path="*" element={<div className="ds-card">404</div>} />
        </Routes>
      </main>

      {!isMySpaceRoute && (
        <footer className="ds-footer">Copyright DataShare® 2025</footer>
      )}
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
