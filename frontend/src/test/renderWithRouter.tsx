import React from "react";
import { MemoryRouter } from "react-router-dom";
import { render } from "@testing-library/react";

type Options = {
  route?: string;
};

export function renderWithRouter(ui: React.ReactElement, options: Options = {}) {
  const { route = "/" } = options;
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}
