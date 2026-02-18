export function LandingPage({ goLogin }: { goLogin: () => void }) {
  return (
    <div className="ds-landing">
      <h1>DataShare</h1>
      <p>Nous gardons vos fichiers en toute sécurité</p>

      <button
        className="ds-primary"
        style={{ marginTop: "32px", maxWidth: "260px" }}
        onClick={goLogin}
      >
        Se connecter
      </button>
    </div>
  );
}
