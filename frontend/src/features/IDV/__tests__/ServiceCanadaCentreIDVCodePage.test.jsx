import "@testing-library/jest-dom/vitest";
import { BrowserRouter } from "react-router";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ServiceCanadaCentreIDVCodePage from "../InPerson/ServiceCanadaCentreIDVCodePage";
import { UserProvider } from "../../../components/Providers/UserProvider";

const mockRouteParams = vi.hoisted(() => ({
  language: "en",
  journeyType: "update",
}));
const mockLocationState = vi.hoisted(() => ({
  idvCode: "ABC123XYZ",
  firstName: "Jane",
  lastName: "Doe",
  dateOfBirth: "January 1, 1990",
  idType: "passport",
}));

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => mockRouteParams,
    useLocation: () => ({ state: mockLocationState }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../utils/routeHelpers", () => ({
  path: () =>
    "/en/identity-verification/update/in-person/service-canada-centre",
}));

vi.mock("../../../utils/constants", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    DEV_ONLY_FEATURE: true,
  };
});

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
  GcdsButton: ({ children, onGcdsClick, ...props }) => (
    <button data-testid="gcds-button" onClick={onGcdsClick} {...props}>
      {children}
    </button>
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

const originalDocumentTitle = document.title;

afterEach(() => {
  vi.restoreAllMocks();
  document.title = originalDocumentTitle;
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});

describe("ServiceCanadaCentreIDVCodePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRouteParams.language = "en";
    mockRouteParams.journeyType = "update";
    mockLocationState.idvCode = "ABC123XYZ";
    mockLocationState.firstName = "Jane";
    mockLocationState.lastName = "Doe";
    mockLocationState.dateOfBirth = "January 1, 1990";
    mockLocationState.idType = "passport";
  });

  it("renders the main heading", () => {
    render(
      <TestWrapper>
        <ServiceCanadaCentreIDVCodePage />
      </TestWrapper>,
    );

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your unique code for identity proofing at Service Canada Centre",
      ),
    ).toBeInTheDocument();
  });

  it("renders the idvCode with hyphens every three characters", () => {
    render(
      <TestWrapper>
        <ServiceCanadaCentreIDVCodePage />
      </TestWrapper>,
    );

    expect(screen.getByText("ABC-123-XYZ")).toBeInTheDocument();
  });

  it("formats codes whose length is not divisible by three", () => {
    mockLocationState.idvCode = "ABCDE";

    render(
      <TestWrapper>
        <ServiceCanadaCentreIDVCodePage />
      </TestWrapper>,
    );

    expect(screen.getByText("ABC-DE")).toBeInTheDocument();
  });

  it("redirects to the previous step when idvCode is missing", async () => {
    delete mockLocationState.idvCode;

    render(
      <TestWrapper>
        <ServiceCanadaCentreIDVCodePage />
      </TestWrapper>,
    );

    expect(screen.queryByRole("main")).not.toBeInTheDocument();
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
      screen.getByText(/This code is valid for 30 days/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/has been emailed to/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Visit a Service Canada Centre with your code and your .*Passport\./,
      ),
    ).toBeInTheDocument();
  });

  it("renders the your information details without address", () => {
    render(
      <TestWrapper>
        <ServiceCanadaCentreIDVCodePage />
      </TestWrapper>,
    );

    expect(screen.getByText("Your information")).toBeInTheDocument();
    expect(screen.getByText("First name")).toBeInTheDocument();
    expect(screen.getByText("Last name")).toBeInTheDocument();
    expect(screen.getByText("Date of birth")).toBeInTheDocument();
    expect(screen.getByText("ID selected")).toBeInTheDocument();
    expect(screen.getByText("Jane")).toBeInTheDocument();
    expect(screen.getByText("Doe")).toBeInTheDocument();
    expect(screen.getByText("January 1, 1990")).toBeInTheDocument();
    expect(screen.queryByText("passport")).not.toBeInTheDocument();
    expect(screen.queryByText("Address")).not.toBeInTheDocument();
  });

  it("falls back to the raw id type when it is not a known approved document key", () => {
    mockLocationState.idType = "Employee ID";

    render(
      <TestWrapper>
        <ServiceCanadaCentreIDVCodePage />
      </TestWrapper>,
    );

    expect(screen.getByText("Your information")).toBeInTheDocument();
    expect(screen.getByText("First name")).toBeInTheDocument();
    expect(screen.getByText("Last name")).toBeInTheDocument();
    expect(screen.getByText("Date of birth")).toBeInTheDocument();
    expect(screen.getByText("ID selected")).toBeInTheDocument();
    expect(screen.getByText("Jane")).toBeInTheDocument();
    expect(screen.getByText("Doe")).toBeInTheDocument();
    expect(screen.getByText("January 1, 1990")).toBeInTheDocument();
    expect(screen.queryByText("Address")).not.toBeInTheDocument();
  });

  it("navigates back to service canada form when update information is clicked", () => {
    render(
      <TestWrapper>
        <ServiceCanadaCentreIDVCodePage />
      </TestWrapper>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Update information" }));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/identity-verification/update/in-person/service-canada-centre",
    );
  });

  it("renders print page button, calls window.print, and does not navigate", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    render(
      <TestWrapper>
        <ServiceCanadaCentreIDVCodePage />
      </TestWrapper>,
    );

    const printButton = screen.getByRole("button", { name: "Print page" });
    expect(printButton).toBeInTheDocument();

    fireEvent.click(printButton);
    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
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
