import "@testing-library/jest-dom/vitest";
import { I18nextProvider } from "react-i18next";
import { createMemoryRouter, RouterProvider } from "react-router";
import { act, render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DisplayEmailInfo from "../ViewEmailInfo";
import ViewContactPhoneNumber from "../../../ContactPhoneNumber/components/ViewContactPhoneNumber";
import ViewLanguagePreferences from "../../../LanguagePreference/components/ViewLanguagePreference";
import i18n from "../../../../i18n/test";

vi.mock("../../../../components/Providers/useUser", () => ({
  useUser: () => ({
    state: {
      userProfile: {
        userName: "jane@example.com",
        preferredLanguage: "fr",
      },
    },
  }),
}));

vi.mock("../../../../hooks/useNavigate", () => ({
  useNavigateHelper: () => vi.fn(),
}));

vi.mock("../../../../components/Badges/VerifiedBadge", () => ({
  default: ({ text }) => <span>{text}</span>,
}));

vi.mock("../../../../utils/routeHelpers", () => ({
  path: () => "/en/profile/update",
}));

const linkCases = [
  {
    name: "email",
    element: <DisplayEmailInfo />,
    englishLabel: "Change Email",
    frenchLabel: "Modifier Adresse courriel",
  },
  {
    name: "contact phone number",
    element: (
      <ViewContactPhoneNumber phoneNumbers={[{ value: "+15551234567" }]} />
    ),
    englishLabel: "Edit Phone number",
    frenchLabel: "Modifier Numéro de téléphone de communication",
  },
  {
    name: "language preference",
    element: <ViewLanguagePreferences />,
    englishLabel: "Edit Language preference",
    frenchLabel: "Modifier Langue de communication",
  },
];

function renderAtEnglishRoute(element) {
  const router = createMemoryRouter([{ path: "/:language/profile", element }], {
    initialEntries: ["/en/profile"],
  });

  render(
    <I18nextProvider i18n={i18n}>
      <RouterProvider router={router} />
    </I18nextProvider>,
  );

  return router;
}

function getLink() {
  return document.querySelector("gcds-link");
}

async function expectHostAndShadowLabels(expectedLabel) {
  await waitFor(() => {
    const link = getLink();
    expect(link).toHaveAttribute("aria-label", expectedLabel);
    expect(link?.shadowRoot?.querySelector("a")).toHaveAttribute(
      "aria-label",
      expectedLabel,
    );
  });
}

describe.each(linkCases)(
  "$name GCDS link language changes",
  ({ element, englishLabel, frenchLabel }) => {
    beforeEach(async () => {
      await i18n.changeLanguage("en");
      document.documentElement.lang = "en";
    });

    it("keeps host and shadow aria labels in sync", async () => {
      const router = renderAtEnglishRoute(element);
      await expectHostAndShadowLabels(englishLabel);

      await act(async () => {
        await i18n.changeLanguage("fr");
        document.documentElement.lang = "fr";
        await router.navigate("/fr/profile");
      });

      await expectHostAndShadowLabels(frenchLabel);
    });
  },
);
