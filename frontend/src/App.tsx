import { useMemo, useState } from "react";
import "./App.css";

import { getToken, logout } from "./api";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

type View = "login" | "register" | "home";

function App() {
  // si un token existe déjà -> on arrive direct sur "home"
  const initialView: View = useMemo(() => (getToken() ? "home" : "login"), []);
  const [view, setView] = useState<View>(initialView);

  if (view === "register") {
    return <RegisterPage onGoLogin={() => setView("login")} />;
  }

  if (view === "home") {
    return (
      <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "sans-serif" }}>
        <h2>Mon espace</h2>
        <p> Connecté (token stocké).</p>

        <button
          style={{ padding: "10px 14px" }}
          onClick={() => {
            logout();
            setView("login");
          }}
        >
          Se déconnecter
        </button>
      </div>
    );
  }

  // view === "login"
  return (
    <LoginPage
      onLoggedIn={() => setView("home")}
      onGoRegister={() => setView("register")}
    />
  );
}

export default App;
