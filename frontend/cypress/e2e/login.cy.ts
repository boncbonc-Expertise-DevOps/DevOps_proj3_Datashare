/// <reference types="cypress" />

describe("E2E - Login", () => {
  it("shows an error on invalid credentials", () => {
    const email = `e2e_${Date.now()}@example.com`;
    const password = "secret123";
    const apiUrl = "http://localhost:3000";

    cy.request("POST", `${apiUrl}/api/auth/register`, { email, password })
      .its("status")
      .should("eq", 201);

    cy.intercept("POST", "/api/auth/login").as("login");

    cy.visit("/login");
    cy.contains("h1", "Connexion").should("be.visible");

    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type("wrong-password");
    cy.contains("button", "Connexion").click();

    cy.wait("@login", { timeout: 20000 }).then((i) => {
      expect(i.response?.statusCode, JSON.stringify(i.response?.body)).to.eq(401);
    });

    cy.location("pathname").should("eq", "/login");
    cy.contains(".ds-error", "Identifiants invalides").should("be.visible");

    cy.window().then((w) => {
      expect(w.localStorage.getItem("accessToken")).to.eq(null);
    });
  });
});
