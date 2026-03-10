import "@testing-library/jest-dom/vitest";
import { BrowserRouter } from "react-router";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ViewContactPhoneNumber from "../components/ViewContactPhoneNumber.jsx";
import { UserProvider } from "../../../components/Providers/UserProvider.tsx";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider.tsx";

// Mock the navigation hook
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ language: "en" }),
  };
});

// Mock the navigate helper
const mockNavigateHelper = vi.fn();
vi.mock("../../../hooks/useNavigate", () => ({
  useNavigateHelper: () => mockNavigateHelper,
}));

// Mock the redirect function to prevent navigation errors
vi.mock("../../../utils/redirect.jsx", () => ({
  redirectToLogin: vi.fn(),
}));

// Mock route helpers
vi.mock("../../../utils/routeHelpers", () => ({
  path: vi.fn(() => "/en/manage-dashboard"),
}));

// In your test file (e.g., ViewContactPhoneNumber.test.jsx)
vi.mock("../../../utils/apiErrorHandler", () => ({
  handleApiError: vi.fn(),
  redirectToLogin: vi.fn(),
}));

// Mock VerifiedBadge component
vi.mock("../../../components/Badges/VerifiedBadge.jsx", () => ({
  default: ({ text }) => <div data-testid="verified-badge">{text}</div>,
}));

// Mock GCDS components
vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsContainer: ({ children, ...props }) => (
    <div data-testid="gcds-container" {...props}>
      {children}
    </div>
  ),
  GcdsHeading: ({ children, marginTop, style, ...props }) => (
    <h3 data-testid="gcds-heading" style={{ marginTop, ...style }} {...props}>
      {children}
    </h3>
  ),
  GcdsGrid: ({ children, placeContent, marginTop, style, ...props }) => (
    <div
      data-testid="gcds-grid"
      style={{ placeContent, marginTop, ...style }}
      {...props}
    >
      {children}
    </div>
  ),
  GcdsText: ({ children, placeContent, style, ...props }) => (
    <p data-testid="gcds-text" style={{ placeContent, ...style }} {...props}>
      {children}
    </p>
  ),
  GcdsLink: ({ children, onGcdsClick, href, ...props }) => (
    <a
      data-testid="gcds-link"
      href={href}
      onClick={(e) => {
        e.preventDefault();
        onGcdsClick?.({ detail: href, preventDefault: e.preventDefault });
      }}
      {...props}
    >
      {children}
    </a>
  ),
  GcdsButton: ({ children, onGcdsClick, ...props }) => (
    <button data-testid="gcds-button" onClick={onGcdsClick} {...props}>
      {children}
    </button>
  ),
}));

// Mock libphonenumber-js
vi.mock("libphonenumber-js", () => ({
  default: vi.fn(),
}));

import parsePhoneNumberFromString from "libphonenumber-js";

const mockUserState = {
  isLoading: false,
  loadingText: null,
  userData: {
    service: "Test Service",
    language: "en",
    email: "test@example.com",
    emailLanguage: null,
    emailValidated: true,
    trxnId: null,
    passwordSubmitted: false,
    phone: null,
    stepVerificationSent: false,
    stepVerified: false,
    viewPrivacy: false,
    id: "test-user-123",
    otpType: null,
    passwordValidated: false,
  },
  userProfile: {
    id: "test-user-123",
    active: true,
    details: {
      emailVerified: true,
      lastLogin: "2025-09-08T12:00:00Z",
      lastMFA: "2025-09-08T12:00:00Z",
      twoFactorAuthentication: true,
      pwdChangedTime: "2025-09-08T12:00:00Z",
    },
    emails: [{ value: "test@example.com", type: "primary" }],
    phoneNumbers: [{ value: "+1234567890", type: "primary" }],
    meta: {
      created: "2025-09-08T12:00:00Z",
      location: "test",
      lastModified: "2025-09-08T12:00:00Z",
      resourceType: "User",
    },
    userName: "testuser",
    preferredLanguage: "en",
    name: {
      givenName: "John",
      familyName: "Doe",
      formatted: "John Doe",
    },
  },
  relyingPartyInfo: {
    icon: "test-icon.png",
    id: "test-service-id",
    linkName: "Test Service",
    url: "https://test-service.example.com",
  },
  authenticatedPages: [],
};

const defaultPageContent = {
  5: "Edit",
  9: "Verified",
  10: "Contact phone number",
  11: "Your contact phone number is",
  18: "No phone number added",
  19: "Add phone number",
};

describe("ViewContactPhoneNumber Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigateHelper.mockClear();
    parsePhoneNumberFromString.mockImplementation((phoneNumber) => {
      if (phoneNumber === "+15551234567") {
        return { formatNational: () => "(555) 123-4567" };
      }
      if (phoneNumber === "+1234567890") {
        return { formatNational: () => "(123) 456-7890" };
      }
      return null;
    });
  });

  const TestWrapper = ({ children }) => (
    <BrowserRouter>
      <UserProvider initial={mockUserState}>
        <LanguageProvider>{children}</LanguageProvider>
      </UserProvider>
    </BrowserRouter>
  );

  it("renders with correct heading", () => {
    render(
      <TestWrapper>
        <ViewContactPhoneNumber
          pageContent={defaultPageContent}
          phoneNumbers={null}
        />
      </TestWrapper>,
    );

    expect(screen.getByTestId("gcds-container")).toBeInTheDocument();
    expect(screen.getByTestId("gcds-heading")).toHaveTextContent(
      "Contact phone number",
    );
  });

  it("renders AddPhoneNumber component when phoneNumbers is null", () => {
    render(
      <TestWrapper>
        <ViewContactPhoneNumber
          pageContent={defaultPageContent}
          phoneNumbers={null}
        />
      </TestWrapper>,
    );

    expect(screen.getByText("No phone number added")).toBeInTheDocument();
    expect(screen.getByText("+ Add phone number")).toBeInTheDocument();
  });

  it("clicking add phone number button navigates to manage dashboard", async () => {
    render(
      <TestWrapper>
        <ViewContactPhoneNumber
          pageContent={defaultPageContent}
          phoneNumbers={null}
        />
      </TestWrapper>,
    );

    const addButton = screen.getByTestId("gcds-button");
    fireEvent.click(addButton);

    await waitFor(() => {
      // to be replaced later
      expect(mockNavigateHelper).toHaveBeenCalledWith("/en/manage-dashboard");
    });
  });

  it("renders ContactPhoneNumber component when phoneNumbers exist", () => {
    const phoneNumbers = [{ value: "+15551234567" }];

    render(
      <TestWrapper>
        <ViewContactPhoneNumber
          pageContent={defaultPageContent}
          phoneNumbers={phoneNumbers}
        />
      </TestWrapper>,
    );

    expect(
      screen.getByText("Your contact phone number is"),
    ).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByTestId("verified-badge")).toHaveTextContent("Verified");
  });

  it("displays formatted phone numbers correctly", () => {
    const phoneNumbers = [{ value: "+15551234567" }, { value: "+1234567890" }];

    render(
      <TestWrapper>
        <ViewContactPhoneNumber
          pageContent={defaultPageContent}
          phoneNumbers={phoneNumbers}
        />
      </TestWrapper>,
    );

    expect(screen.getByText("(555) 123-4567")).toBeInTheDocument();
    expect(screen.getByText("(123) 456-7890")).toBeInTheDocument();
  });

  it("clicking edit link navigates to manage dashboard", async () => {
    const phoneNumbers = [{ value: "+15551234567" }];

    render(
      <TestWrapper>
        <ViewContactPhoneNumber
          pageContent={defaultPageContent}
          phoneNumbers={phoneNumbers}
        />
      </TestWrapper>,
    );

    const editLink = screen.getByTestId("gcds-link");
    fireEvent.click(editLink);

    await waitFor(() => {
      expect(mockNavigateHelper).toHaveBeenCalledWith("/en/manage-dashboard");
    });
  });

  it("handles phone number parsing errors gracefully", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      parsePhoneNumberFromString.mockImplementation(() => {
        throw new Error("Invalid phone number");
      });
      const phoneNumbers = [{ value: "invalid-phone" }];
      render(
        <TestWrapper>
          <ViewContactPhoneNumber
            pageContent={defaultPageContent}
            phoneNumbers={phoneNumbers}
          />
        </TestWrapper>,
      );
      expect(screen.getByText("invalid-phone")).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to parse phone number: invalid-phone",
      );
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it("displays original phone number when parsing returns null", () => {
    parsePhoneNumberFromString.mockReturnValue(null);

    const phoneNumbers = [{ value: "1234567890" }];

    render(
      <TestWrapper>
        <ViewContactPhoneNumber
          pageContent={defaultPageContent}
          phoneNumbers={phoneNumbers}
        />
      </TestWrapper>,
    );

    expect(screen.getByText("1234567890")).toBeInTheDocument();
  });

  it("handles empty phone numbers array", () => {
    render(
      <TestWrapper>
        <ViewContactPhoneNumber
          pageContent={defaultPageContent}
          phoneNumbers={[]}
        />
      </TestWrapper>,
    );

    expect(screen.getByText("No phone number added")).toBeInTheDocument();
  });

  it("matches snapshot with no phone numbers", () => {
    const { container } = render(
      <TestWrapper>
        <ViewContactPhoneNumber
          pageContent={defaultPageContent}
          phoneNumbers={null}
        />
      </TestWrapper>,
    );
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot with phone numbers", () => {
    const phoneNumbers = [{ value: "+15551234567" }];

    const { container } = render(
      <TestWrapper>
        <ViewContactPhoneNumber
          pageContent={defaultPageContent}
          phoneNumbers={phoneNumbers}
        />
      </TestWrapper>,
    );
    expect(container).toMatchSnapshot();
  });
});
