/// <reference types="cypress" />

describe("E2E - Auth -> MySpace", () => {
  it("register via API then login via UI", () => {
    const email = `e2e_${Date.now()}@example.com`;
    const password = "secret123";

    const apiUrl = "http://localhost:3000";

    // Observe the frontend's requests (via Vite proxy) to help debug UI states.
    cy.intercept("GET", "/api/auth/me").as("me");
    cy.intercept("GET", /\/api\/files\?.*/).as("files");

    cy.request("POST", `${apiUrl}/api/auth/register`, { email, password }).its("status").should("eq", 201);

    cy.visit("/login");
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.contains("button", "Connexion").click();

    cy.location("pathname").should("eq", "/myspace");

    // The login flow triggers /api/auth/me, then MySpace triggers /api/files.
    cy.wait("@me", { timeout: 20000 }).then((i) => {
      expect(i.response?.statusCode, JSON.stringify(i.response?.body)).to.eq(200);
    });
    cy.wait("@files", { timeout: 20000 }).then((i) => {
      expect(i.response?.statusCode, JSON.stringify(i.response?.body)).to.eq(200);
    });

    // Wait for either the list shell (sidebar) OR the empty full-page screen.
    cy.get("body", { timeout: 20000 }).should(($body) => {
      const hasShell = $body.find(".ds-myspace-layout").length > 0;
      const hasEmptyFull = $body.find(".ds-myspace-empty-full").length > 0;
      expect(hasShell || hasEmptyFull).to.eq(true);
    });

    // If the page still doesn't show the expected UI, surface a helpful message.
    cy.get("body").should(($body) => {
      if ($body.find(".ds-error").length) {
        const msg = $body.find(".ds-error").text();
        throw new Error(`UI error state: ${msg}`);
      }
    });

    cy.contains("button", "Déconnexion", { timeout: 20000 }).should("be.visible");

    // Nouvel utilisateur (créé dans ce test) : aucun fichier => empty-state attendu.
    cy.contains("Tu veux partager un fichier ?", { timeout: 20000 }).should("be.visible");
    cy.get('[aria-label="Ajouter des fichiers"]', { timeout: 20000 }).should("be.visible");
  });
});
