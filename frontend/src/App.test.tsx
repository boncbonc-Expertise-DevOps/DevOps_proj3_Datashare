import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import App from "./App";
import { renderWithRouter } from "./test/renderWithRouter";

vi.mock("./api", () => {
  return {
    apiMe: vi.fn(async () => undefined),
    getToken: vi.fn(() => null),
    logout: vi.fn(),
  };
});

describe("App routing", () => {
  it("renders landing page at /", () => {
    renderWithRouter(<App />, { route: "/" });
    expect(screen.getByRole("heading", { name: "DataShare" })).toBeInTheDocument();
    expect(screen.getByText(/Nous gardons vos fichiers en toute sécurité/i)).toBeInTheDocument();
  });

  it("renders login page at /login", () => {
    renderWithRouter(<App />, { route: "/login" });
    expect(screen.getByRole("heading", { name: "Connexion" })).toBeInTheDocument();
  });

  it("renders register page at /register", () => {
    renderWithRouter(<App />, { route: "/register" });
    expect(screen.getByRole("heading", { name: "Créer un compte" })).toBeInTheDocument();
  });

  it("renders 404 at unknown route", () => {
    renderWithRouter(<App />, { route: "/does-not-exist" });
    expect(screen.getByText("404")).toBeInTheDocument();
  });
});
