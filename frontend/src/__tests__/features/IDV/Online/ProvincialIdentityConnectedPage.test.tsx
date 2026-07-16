import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ProvincialIdentityConnectedPage from "../../../../features/IDV/Online/ProvincialIdentityConnectedPage";

const mockNavigate = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en", journeyType: "standard" }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../../utils/routeHelpers", () => ({
  path: () => "/en/identity-verification/standard/online/bluink/confirmation",
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
  GcdsButton: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

describe("ProvincialIdentityConnectedPage", () => {
  it("navigates to the IDV success page when Continue is clicked", () => {
    render(<ProvincialIdentityConnectedPage />);

    screen
      .getByRole("button", {
        name: "ProvincialVerificationConnected.continueButton",
      })
      .click();

    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/identity-verification/standard/online/bluink/confirmation",
    );
  });
});
