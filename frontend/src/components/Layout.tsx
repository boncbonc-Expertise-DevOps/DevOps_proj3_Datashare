import React from "react";
import "../styles/theme.css";

type LayoutProps = {
  ctaLabel?: string;
  onCtaClick?: () => void;
  children: React.ReactNode;
};

export function Layout({ ctaLabel, onCtaClick, children }: LayoutProps) {
  return (
    <div className="ds-page">
      <header className="ds-header">
        <div className="ds-brand">DataShare</div>
        {ctaLabel ? (
          <button className="ds-cta" onClick={onCtaClick}>
            {ctaLabel}
          </button>
        ) : (
          <div />
        )}
      </header>

      <main className="ds-main">{children}</main>

      <footer className="ds-footer">Copyright DataShare 2025</footer>
    </div>
  );
}
