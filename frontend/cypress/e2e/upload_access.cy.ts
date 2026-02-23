/// <reference types="cypress" />

describe("E2E - Upload -> Accéder -> Download", () => {
  it("uploads a file and opens the public download page", () => {
    const email = `e2e_${Date.now()}@example.com`;
    const password = "secret123";
    const apiUrl = "http://localhost:3000";

    cy.request("POST", `${apiUrl}/api/auth/register`, { email, password })
      .its("status")
      .should("eq", 201);

    cy.intercept("GET", "/api/auth/me").as("me");
    cy.intercept("GET", /\/api\/files\?.*/).as("files");
    cy.intercept("POST", "/api/files/upload").as("upload");
    cy.intercept("GET", /\/api\/download\/[^/]+\/meta/).as("dlMeta");

    cy.visit("/login");
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.contains("button", "Connexion").click();

    cy.location("pathname").should("eq", "/myspace");
    cy.wait("@me", { timeout: 20000 }).then((i) => {
      expect(i.response?.statusCode, JSON.stringify(i.response?.body)).to.be.oneOf([200, 304]);
    });
    cy.wait("@files", { timeout: 20000 }).then((i) => {
      expect(i.response?.statusCode, JSON.stringify(i.response?.body)).to.be.oneOf([200, 304]);
    });

    cy.get(".ds-myspace-topbar").contains("button", "Ajouter des fichiers").click();
    cy.contains("h2", "Ajouter des fichiers").should("be.visible");

    cy.get("#ds-upload-file").selectFile("cypress/fixtures/hello.txt", { force: true });
    cy.contains("button", "Uploader").should("not.be.disabled").click();

    cy.wait("@upload", { timeout: 20000 }).then((i) => {
      expect(i.response?.statusCode, JSON.stringify(i.response?.body)).to.eq(201);
      const token = (i.response?.body as any)?.file?.downloadToken;
      expect(token).to.match(/^[0-9a-fA-F-]{36}$/);
      cy.wrap(token).as("token");
    });

    // Go back to list and refresh deterministically
    cy.get(".ds-myspace-nav").contains("button", "Mes fichiers").click();
    cy.wait("@files", { timeout: 20000 }).then((i) => {
      expect(i.response?.statusCode, JSON.stringify(i.response?.body)).to.be.oneOf([200, 304]);
    });

    cy.contains(".ds-file-row", "hello.txt", { timeout: 20000 }).within(() => {
      cy.contains("button", "Accéder").click();
    });

    cy.get("@token").then((token) => {
      cy.location("pathname", { timeout: 20000 }).should("eq", `/download/${token}`);
    });

    cy.wait("@dlMeta", { timeout: 20000 }).then((i) => {
      expect(i.response?.statusCode, JSON.stringify(i.response?.body)).to.be.oneOf([200, 304]);
    });
    cy.contains("h1", "Téléchargement").should("be.visible");
    cy.contains(".ds-input-row", "hello.txt").should("be.visible");
  });
});
