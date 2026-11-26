import "@testing-library/jest-dom/vitest";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router";
import { act, render, waitFor } from "@testing-library/react";
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

describe("ViewProfileNameCard GCDS link language changes", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    document.documentElement.lang = "en";
  });

  it("keeps the host and shadow link labels in sync when language changes", async () => {
    renderNameCard("en");

    const getLink = () => document.querySelector("gcds-link");

    await waitFor(() => {
      expect(getLink()?.shadowRoot?.querySelector("a")).toHaveAttribute(
        "aria-label",
        "Edit name",
      );
    });

    await act(async () => {
      await i18n.changeLanguage("fr");
      document.documentElement.lang = "fr";
    });

    await waitFor(() => {
      const link = getLink();
      expect(link).toHaveAttribute("aria-label", "Modifier le nom");
      expect(link?.shadowRoot?.querySelector("a")).toHaveAttribute(
        "aria-label",
        "Modifier le nom",
      );
    });
  });
});
