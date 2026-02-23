/// <reference types="cypress" />

describe("E2E - Download", () => {
  it("downloads a public file and returns expected content", () => {
    const email = `e2e_${Date.now()}@example.com`;
    const password = "secret123";
    const apiUrl = "http://localhost:3000";

    cy.request("POST", `${apiUrl}/api/auth/register`, { email, password })
      .its("status")
      .should("eq", 201);

    cy.intercept("GET", "/api/auth/me").as("me");
    cy.intercept("GET", /\/api\/files\?.*/).as("files");
    cy.intercept("POST", "/api/files/upload").as("upload");

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

    cy.get<string>("@token").then((token) => {
      cy.request({
        method: "GET",
        url: `/api/download/${token}`,
        headers: { "cache-control": "no-cache" },
      }).then((res) => {
        expect(res.status).to.eq(200);
        const cd = String(res.headers["content-disposition"] || "");
        expect(cd.toLowerCase()).to.include("attachment");

        const body = typeof res.body === "string" ? res.body : JSON.stringify(res.body);
        expect(body).to.include("hello from cypress e2e");
      });
    });
  });
});
