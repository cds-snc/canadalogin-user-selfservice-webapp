import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, it, expect, vi } from "vitest";
import ProofingBarcodeCanadaPostPage from "../InPerson/ProofingBarcodeCanadaPostPage";
import { UserProvider } from "../../../components/Providers/UserProvider";
import { PAGES } from "../../../utils/constants";

const mockNavigate = vi.fn();

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../utils/constants", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    DEV_ONLY_FEATURE: true,
  };
});

vi.mock("../../../utils/routeHelpers", () => ({
  path: (pageId, params) => `/${params.language}/${pageId}`,
}));

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
  GcdsNotice: ({ children, noticeTitle, ...props }) => (
    <div data-testid="gcds-notice" {...props}>
      <div>{noticeTitle}</div>
      {children}
    </div>
  ),
  GcdsLink: ({ children, href, external: _external, ...props }) => (
    <a data-testid="gcds-link" href={href} {...props}>
      {children}
    </a>
  ),
  GcdsButton: ({
    children,
    onGcdsClick,
    buttonRole: _buttonRole,
    ...props
  }) => (
    <button
      data-testid="gcds-button"
      type="button"
      onClick={onGcdsClick}
      {...props}
    >
      {children}
    </button>
  ),
  GcdsDetails: ({ children, detailsTitle }) => (
    <details data-testid="gcds-details">
      <summary>{detailsTitle}</summary>
      {children}
    </details>
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

const TestWrapper = ({ children, entryState = null }) => (
  <MemoryRouter
    initialEntries={[
      {
        pathname: "/en/idv/in-person/canada-post/idv-code",
        state: entryState,
      },
    ]}
  >
    <Routes>
      <Route
        path="/:language/idv/in-person/canada-post/idv-code"
        element={
          <UserProvider initial={mockUserState}>{children}</UserProvider>
        }
      />
    </Routes>
  </MemoryRouter>
);

describe("ProofingBarcodeCanadaPostPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("navigates back to the Canada Post page when update information is clicked", () => {
    render(
      <TestWrapper>
        <ProofingBarcodeCanadaPostPage />
      </TestWrapper>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Update information" }));
    expect(mockNavigate).toHaveBeenCalledWith(
      `/en/${PAGES.idvVisitCanadaPostPage}`,
    );
  });

  it("renders the requested heading", () => {
    render(
      <TestWrapper>
        <ProofingBarcodeCanadaPostPage />
      </TestWrapper>,
    );

    expect(
      screen.getByText("Take your proofing barcode to Canada Post"),
    ).toBeInTheDocument();
  });

  it("renders fallback barcode and placeholder information", () => {
    render(
      <TestWrapper>
        <ProofingBarcodeCanadaPostPage />
      </TestWrapper>,
    );

    expect(
      screen.getByRole("img", { name: /Barcode for code/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("user@example.com", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("--").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Provincial/Territorial Driver's Licence"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Secure Certificate of Indian Status"),
    ).toBeInTheDocument();
  });

  it("renders values passed from previous page using location.state", () => {
    render(
      <TestWrapper
        entryState={{
          idvCode: "CP12345678",
          email: "testemail@emci.com",
          givenName: "Name",
          lastName: "Lastname",
          dateOfBirth: "2000-10-15",
          idSelected: "Email statement",
          acceptableIds: ["Passport", "Driver's licence"],
        }}
      >
        <ProofingBarcodeCanadaPostPage />
      </TestWrapper>,
    );

    expect(
      screen.getByRole("img", { name: /Barcode for code/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("user@example.com", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Lastname")).toBeInTheDocument();
    expect(
      screen.getByText((content, element) => {
        return element && element.textContent === "2000-10-15";
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Email statement")).toBeInTheDocument();
    expect(screen.getByText("Passport")).toBeInTheDocument();
  });

  it("renders update information button and nearest Canada Post notice", () => {
    render(
      <TestWrapper>
        <ProofingBarcodeCanadaPostPage />
      </TestWrapper>,
    );

    expect(screen.getByText("Update information")).toBeInTheDocument();
    expect(
      screen.getByText("Find your nearest Canada Post"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("gcds-link")).toHaveTextContent(
      "Canada Post near you",
    );
  });
});
