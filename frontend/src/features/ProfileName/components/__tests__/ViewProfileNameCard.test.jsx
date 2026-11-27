import "@testing-library/jest-dom/vitest";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router";
import { act, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ViewProfileNameCard from "../ViewProfileNameCard";
import i18n from "../../../../i18n/test";

vi.mock("../../../../components/Providers/useUser", () => ({
  useUser: () => ({
    state: { userProfile: { name: { formatted: "Jane Doe" } } },
  }),
}));

vi.mock("../../../../hooks/useNavigate", () => ({
  useNavigateHelper: () => vi.fn(),
}));

vi.mock("../../../../utils/routeHelpers", () => ({
  path: () => "/en/profile/update-name",
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }) => <div>{children}</div>,
  GcdsHeading: ({ children }) => <h3>{children}</h3>,
  GcdsLink: ({ children, _onGcdsClick, ...props }) => (
    <a {...props}>{children}</a>
  ),
  GcdsText: ({ children }) => <p>{children}</p>,
}));

function renderNameCard(language) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[`/${language}/profile`]}>
        <Routes>
          <Route path="/:language/profile" element={<ViewProfileNameCard />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("ViewProfileNameCard accessible label", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders the English edit label", () => {
    renderNameCard("en");

    expect(screen.getByRole("link", { name: "Edit name" })).toBeInTheDocument();
  });

  it("renders the French edit label", async () => {
    await act(async () => {
      await i18n.changeLanguage("fr");
    });
    renderNameCard("fr");

    expect(
      screen.getByRole("link", { name: "Modifier le nom" }),
    ).toBeInTheDocument();
  });

  it("updates the link language when the active translation changes", async () => {
    renderNameCard("en");

    await act(async () => {
      await i18n.changeLanguage("fr");
    });

    expect(
      screen.getByRole("link", { name: "Modifier le nom" }),
    ).toHaveAttribute("lang", "fr");
  });
});
