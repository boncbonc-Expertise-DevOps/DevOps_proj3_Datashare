import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LandingPage } from "./LandingPage";
import { renderWithRouter } from "../test/renderWithRouter";

describe("LandingPage", () => {
  it("renders and calls goLogin on click", async () => {
    const goLogin = vi.fn();
    renderWithRouter(<LandingPage goLogin={goLogin} />);

    expect(screen.getByRole("heading", { name: "DataShare" })).toBeInTheDocument();
    expect(screen.getByText(/gardons vos fichiers/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Se connecter" }));
    expect(goLogin).toHaveBeenCalledTimes(1);
  });
});
