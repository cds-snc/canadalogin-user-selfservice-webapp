import "@testing-library/jest-dom/vitest";
import { BrowserRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ServiceCanadaCentreIDVCodePage from "../ServiceCanadaCentreIDVCodePage";
import { UserProvider } from "../../../components/Providers/UserProvider";

// Mock GCDS components
vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children, ...props }) => (
    <div data-testid="gcds-container" {...props}>
      {children}
    </div>
  ),
  GcdsGrid: ({ children, ...props }) => (
    <div data-testid="gcds-grid" {...props}>
      {children}
    </div>
  ),
  GcdsHeading: ({ children, tag, ...props }) => {
    const Tag = tag || "h1";
    return (
      <Tag data-testid="gcds-heading" {...props}>
        {children}
      </Tag>
    );
  },
  GcdsText: ({ children, ...props }) => (
    <p data-testid="gcds-text" {...props}>
      {children}
    </p>
  ),
  GcdsNotice: ({
    children,
    noticeTitle,
    _noticeTitleTag,
    noticeRole,
    ...props
  }) => (
    <div data-testid="gcds-notice" role={noticeRole} {...props}>
      <div data-testid="gcds-notice-title">{noticeTitle}</div>
      {children}
    </div>
  ),
  GcdsLink: ({ children, href, _external, ...props }) => (
    <a data-testid="gcds-link" href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockUserState = {
  isLoading: false,
  loadingText: null,
  userData: {
    service: "Test Service",
    language: "en",
    email: "user@example.com",
    id: "test-user-123",
  },
  userProfile: {
    id: "test-user-123",
    userName: "user@example.com",
    name: {
      givenName: "Jane",
      familyName: "Doe",
      formatted: "Jane Doe",
    },
  },
  relyingPartyInfo: null,
  authenticatedPages: [],
};

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <UserProvider initial={mockUserState}>{children}</UserProvider>
  </BrowserRouter>
);

describe("ServiceCanadaCentreIDVCodePage", () => {
  it("renders the main heading", () => {
    render(
      <TestWrapper>
        <ServiceCanadaCentreIDVCodePage />
      </TestWrapper>,
    );

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Here is your unique identification code for your identity proofing",
      ),
    ).toBeInTheDocument();
  });

  it("renders the provided idvCode", () => {
    render(
      <TestWrapper>
        <ServiceCanadaCentreIDVCodePage idvCode="ABC123XYZ" />
      </TestWrapper>,
    );

    expect(screen.getByText("ABC123XYZ")).toBeInTheDocument();
  });

  it("renders the fallback code when idvCode is not provided", () => {
    render(
      <TestWrapper>
        <ServiceCanadaCentreIDVCodePage />
      </TestWrapper>,
    );

    expect(screen.getByText("387DHROGJ")).toBeInTheDocument();
  });

  it("renders the user email from context", () => {
    render(
      <TestWrapper>
        <ServiceCanadaCentreIDVCodePage />
      </TestWrapper>,
    );

    expect(
      screen.getByText("user@example.com", { exact: false }),
    ).toBeInTheDocument();
  });

  it("renders the code validity and visit instruction text", () => {
    render(
      <TestWrapper>
        <ServiceCanadaCentreIDVCodePage />
      </TestWrapper>,
    );

    expect(
      screen.getByText(
        /This code is valid for 30 days and has been emailed to/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Visit a Service Canada Centre with your code and one valid ID document.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the find nearest Service Canada Centre notice", () => {
    render(
      <TestWrapper>
        <ServiceCanadaCentreIDVCodePage />
      </TestWrapper>,
    );

    expect(screen.getByTestId("gcds-notice")).toBeInTheDocument();
    expect(
      screen.getByText("Find your nearest Service Canada Centre"),
    ).toBeInTheDocument();
  });

  it("renders the external link to find a Service Canada Centre", () => {
    render(
      <TestWrapper>
        <ServiceCanadaCentreIDVCodePage />
      </TestWrapper>,
    );

    const link = screen.getByTestId("gcds-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "#");
    expect(link).toHaveTextContent("Service Canada Centre near you");
  });

  it("renders an empty email when user profile has no userName", () => {
    const stateWithNoEmail = {
      ...mockUserState,
      userProfile: null,
    };

    render(
      <BrowserRouter>
        <UserProvider initial={stateWithNoEmail}>
          <ServiceCanadaCentreIDVCodePage />
        </UserProvider>
      </BrowserRouter>,
    );

    // Component should still render without crashing
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
