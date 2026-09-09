import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ConnectedServicesPage from "../ConnectedServicesPage";

let mockDevOnlyFeature = true;

vi.mock("react-router", () => ({
  useParams: () => ({ language: "en" }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "successNotice.title":
          "Your information was successfully saved in CanadaLogin",
        "successNotice.body": "Your verified information has been updated.",
        heading: "Sign in to services to apply this update",
        description: "Service update description",
        servicesHeading: "Services needing you to sign in again",
        servicesDescription: "Save your active progress.",
        "sessions.activeSession": "Active session",
        "sessions.inactiveSession": "Inactive session",
        signOutEverywhere: "Sign out everywhere",
        doThisLater: "I'll do this later",
        informationHeading: "This update only applies to connected services.",
        informationBody: "Update a separate account directly.",
        directoryPrefix: "Visit the",
        directoryLink: "Government of Canada account directory",
      })[key] ?? key,
  }),
}));

vi.mock("../../../../utils/constants", () => ({
  get DEV_ONLY_FEATURE() {
    return mockDevOnlyFeature;
  },
  EXTERNAL_NAVIGATION_LINKS: {
    gcAccountDirectory:
      "https://www.canada.ca/en/government/sign-in-online-account.html",
  },
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsButton: ({
    children,
    buttonRole,
  }: React.PropsWithChildren<{ buttonRole?: string }>) => (
    <button data-button-role={buttonRole}>{children}</button>
  ),
  GcdsContainer: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  GcdsGrid: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  GcdsHeading: ({
    children,
    tag,
  }: React.PropsWithChildren<{ tag: "h1" | "h2" }>) => {
    const Tag = tag;
    return <Tag>{children}</Tag>;
  },
  GcdsLink: ({ children, href }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href}>{children}</a>
  ),
  GcdsNotice: ({
    children,
    noticeRole,
    noticeTitle,
  }: React.PropsWithChildren<{ noticeRole: string; noticeTitle: string }>) => (
    <div data-notice-role={noticeRole} data-notice-title={noticeTitle}>
      {children}
    </div>
  ),
  GcdsText: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
}));

afterEach(() => {
  mockDevOnlyFeature = true;
});

describe("ConnectedServicesPage", () => {
  it("renders the success notice, service sessions, and actions in development", () => {
    render(<ConnectedServicesPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Sign in to services to apply this update",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Service A")).toBeInTheDocument();
    expect(screen.getByText("Active session")).toBeInTheDocument();
    expect(screen.getByText("Service B")).toBeInTheDocument();
    expect(screen.getByText("Inactive session")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign out everywhere" }),
    ).toHaveAttribute("data-button-role", "danger");
    expect(
      screen.getByRole("button", { name: "I'll do this later" }),
    ).toHaveAttribute("data-button-role", "secondary");
    expect(
      screen.getByRole("link", {
        name: "Government of Canada account directory",
      }),
    ).toHaveAttribute(
      "href",
      "https://www.canada.ca/en/government/sign-in-online-account.html",
    );
  });

  it("does not render outside the development environment", () => {
    mockDevOnlyFeature = false;

    const { container } = render(<ConnectedServicesPage />);

    expect(container).toBeEmptyDOMElement();
  });
});
