import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

import ManageDashboard from "../ManageDashboard";
import i18n from "../../../i18n/test";

const mocks = vi.hoisted(() => ({
  devOnlyFeature: true,
  navigate: vi.fn(),
  trackCardClick: vi.fn(),
}));

vi.mock("react-router", () => ({
  useParams: () => ({ language: "en" }),
}));

vi.mock("../../../hooks/useError", () => ({
  useError: () => ({
    getError: () => ({ errorMsg: "", heading: "" }),
    hasErrors: () => false,
  }),
}));

vi.mock("../../../hooks/useNavigate", () => ({
  useNavigateHelper: () => mocks.navigate,
}));

vi.mock("../../../components/Providers/useUser", () => ({
  useUser: () => ({
    state: {
      userProfile: {
        name: { givenName: "Jane", familyName: "Doe" },
      },
    },
  }),
}));

vi.mock("../../../utils/constants", () => ({
  get DEV_ONLY_FEATURE() {
    return mocks.devOnlyFeature;
  },
  PAGES: {
    ProfileHome: "ProfileHome",
    securitySettings: "SecuritySettings",
    connectedServices: "ConnectedServices",
  },
}));

vi.mock("../../../utils/routeHelpers", () => ({
  path: vi.fn((page) => {
    const routes = {
      ProfileHome: "/en/profile",
      SecuritySettings: "/en/security-settings",
      ConnectedServices: "/en/connected-services",
    };
    return routes[page as keyof typeof routes];
  }),
}));

vi.mock("../../../utils/gatag", () => ({
  trackCardClick: mocks.trackCardClick,
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsCard: ({ cardTitle, href, onGcdsClick, imgSrc, children }) => (
    <article>
      <a
        href={href}
        onClick={(event) => {
          event.preventDefault();
          onGcdsClick?.({ detail: href, preventDefault: vi.fn() });
        }}
      >
        <h3>{cardTitle}</h3>
        <img src={imgSrc} alt="" />
        {children}
      </a>
    </article>
  ),
  GcdsContainer: ({ children, role }) => <div role={role}>{children}</div>,
  GcdsErrorSummary: () => null,
  GcdsGrid: ({ children }) => <div>{children}</div>,
  GcdsHeading: ({ children, tag: Tag = "h2" }) => <Tag>{children}</Tag>,
  GcdsText: ({ children }) => <p>{children}</p>,
}));

describe("ManageDashboard", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.devOnlyFeature = true;
    await i18n.changeLanguage("en");
  });

  const renderDashboard = () =>
    render(
      <I18nextProvider i18n={i18n}>
        <ManageDashboard />
      </I18nextProvider>,
    );

  it("renders the Connected Services card with its destination and description", () => {
    renderDashboard();

    const cardLink = screen.getByRole("link", { name: /Connected services/i });

    expect(cardLink).toHaveAttribute("href", "/en/connected-services");
    expect(cardLink).toHaveTextContent(
      "View the services currently connected with your CanadaLogin and other available government programs.",
    );
    expect(cardLink.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("connected_services_icon.svg"),
    );
  });

  it("navigates to Connected Services and tracks the card click", () => {
    renderDashboard();

    fireEvent.click(screen.getByRole("link", { name: /Connected services/i }));

    expect(mocks.navigate).toHaveBeenCalledWith("/en/connected-services");
    expect(mocks.trackCardClick).toHaveBeenCalledWith({
      card_name: "Connected Services",
      card_type: "navigation",
      destination: "/en/connected-services",
    });
  });

  it("does not render the Connected Services card outside the development feature", () => {
    mocks.devOnlyFeature = false;

    renderDashboard();

    expect(
      screen.queryByRole("link", { name: /Connected services/i }),
    ).not.toBeInTheDocument();
  });
});
