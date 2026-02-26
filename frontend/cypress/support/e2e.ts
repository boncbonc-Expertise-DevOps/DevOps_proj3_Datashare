// Support file for Cypress E2E tests.

declare global {
	namespace Cypress {
		interface Chainable {
			/**
			 * Ouvre l'écran d'upload depuis MySpace.
			 * - Sur l'empty-space: bouton rond (aria-label)
			 * - Sur le shell/list: CTA dans la topbar
			 */
			openUploadFromMySpace(): Chainable<void>;
		}
	}
}

Cypress.Commands.add("openUploadFromMySpace", () => {
	// Attendre qu'un des deux déclencheurs soit présent (retryable)
	cy.get("body", { timeout: 20000 }).should(() => {
		const hasEmptyBtn = Cypress.$('[aria-label="Ajouter des fichiers"]').length > 0;
		const hasTopbarBtn =
			Cypress.$(".ds-myspace-topbar button")
				.toArray()
				.some((b) => (b.textContent || "").includes("Ajouter des fichiers"));

		expect(hasEmptyBtn || hasTopbarBtn, "has upload trigger").to.eq(true);
	});

	cy.then(() => {
		if (Cypress.$('[aria-label="Ajouter des fichiers"]').length > 0) {
			cy.get('[aria-label="Ajouter des fichiers"]').click({ force: true });
			return;
		}

		cy.contains(".ds-myspace-topbar button", "Ajouter des fichiers").click({ force: true });
	});
});

export {};
