import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ProvincialVerificationPage from "../../../../features/IDV/Online/ProvincialVerificationPage";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ language: "en", journeyType: "standard" }),
    useLocation: () => ({ search: "?Target=%2Fen%2Fservices" }),
  };
});

vi.mock("../../../../config", () => ({
  default: {
    apiUrl: "https://api.example.com",
    gatag: "",
    environment: "dev",
    releaseTag: undefined,
  },
}));

vi.mock("../../../../utils/routeHelpers", () => ({
  path: () => "/en/identity-verification/standard/online/provincial/connected",
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  GcdsGrid: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  GcdsHeading: ({ children }: { children: React.ReactNode }) => (
    <h1>{children}</h1>
  ),
  GcdsText: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  GcdsButton: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
  GcdsNotice: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  GcdsLink: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  GcdsCard: ({ cardTitle, href }: { cardTitle: string; href: string }) => (
    <a href={href}>{cardTitle}</a>
  ),
}));

vi.mock("../../../../assets/images/BC_card.png", () => ({
  default: "bc-card.png",
}));

vi.mock("../../../../assets/images/AB_card.png", () => ({
  default: "ab-card.png",
}));

describe("ProvincialVerificationPage", () => {
  it("builds provincial partner login links with returnToPage and partner key", () => {
    render(<ProvincialVerificationPage />);

    const bcLink = screen.getByRole("link", {
      name: "ProvincialVerification.bcServicesCard",
    });

    const abLink = screen.getByRole("link", {
      name: "ProvincialVerification.albertaAccount",
    });

    expect(bcLink).toHaveAttribute(
      "href",
      "https://api.example.com/v1/auth/login?returnToPage=%2Fen%2Fidentity-verification%2Fstandard%2Fonline%2Fprovincial%2Fconnected%3FTarget%3D%252Fen%252Fservices&partner=bcsc",
    );

    expect(abLink).toHaveAttribute(
      "href",
      "https://api.example.com/v1/auth/login?returnToPage=%2Fen%2Fidentity-verification%2Fstandard%2Fonline%2Fprovincial%2Fconnected%3FTarget%3D%252Fen%252Fservices&partner=ab",
    );
  });
});
