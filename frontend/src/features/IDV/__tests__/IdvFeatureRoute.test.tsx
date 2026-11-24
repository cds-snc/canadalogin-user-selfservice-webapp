import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import IdvFeatureRoute from "../IdvFeatureRoute";

let mockHasIdvFeatureAccess = false;

vi.mock("../../../hooks/useIdvFeatureAccess", () => ({
  useIdvFeatureAccess: () => mockHasIdvFeatureAccess,
}));

function renderIdvRoutes() {
  return render(
    <MemoryRouter initialEntries={["/en/identity-verification"]}>
      <Routes>
        <Route path="/:language" element={<Outlet />}>
          <Route index element={<h1>Dashboard</h1>} />
          <Route path="identity-verification" element={<IdvFeatureRoute />}>
            <Route index element={<h1>IDV flow</h1>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("IdvFeatureRoute", () => {
  beforeEach(() => {
    mockHasIdvFeatureAccess = false;
  });

  it("redirects users without IDV access to their dashboard", async () => {
    renderIdvRoutes();

    expect(
      await screen.findByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "IDV flow" })).toBeNull();
  });

  it("renders child IDV routes for users with access", () => {
    mockHasIdvFeatureAccess = true;

    renderIdvRoutes();

    expect(
      screen.getByRole("heading", { name: "IDV flow" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Dashboard" })).toBeNull();
  });
});
