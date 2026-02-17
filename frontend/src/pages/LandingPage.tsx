import { Layout } from "../components/Layout";

export function LandingPage({ goLogin }: { goLogin: () => void }) {
  return (
    <Layout ctaLabel="Se connecter" onCtaClick={goLogin}>
      <div className="ds-landing">
        <h1>DataShare</h1>
        <p> Nous gardons vos fichiers en toute sécurité </p>
      </div>
    </Layout>
  );
}
