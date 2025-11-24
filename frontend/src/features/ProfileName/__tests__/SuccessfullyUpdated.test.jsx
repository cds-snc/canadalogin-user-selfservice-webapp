import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BrowserRouter } from "react-router";
import "@testing-library/jest-dom";
import SuccessfullyUpdatedName from "../components/SuccessfullyUpdated.jsx";

const mockNavigate = vi.fn();
const mockSetLoading = vi.fn();
const mockDispatch = vi.fn();

const mockUserState = {
  userProfile: { name: { formatted: "John Doe" } },
};

// Create TestWrapper component
const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ language: "en" }),
  };
});

// Remove the duplicate mock and keep only this one with vi.fn()
vi.mock("../../../components/Providers/useUser.tsx", () => ({
  useUser: vi.fn(() => ({
    state: mockUserState,
    dispatch: mockDispatch,
  })),
}));

vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsButton: ({
    children,
    buttonId,
    onGcdsClick,
    disabled,
    buttonType,
    buttonRole,
    ...props
  }) => (
    <button
      data-testid={buttonId}
      onClick={onGcdsClick}
      disabled={disabled}
      data-button-type={buttonType}
      data-button-role={buttonRole}
      {...props}
    >
      {children}
    </button>
  ),
  GcdsText: ({ marginTop, marginBottom, children, ...props }) => (
    <p
      {...props}
      style={{
        marginTop: marginTop,
        marginBottom: marginBottom,
        ...props.style,
      }}
    >
      {children}
    </p>
  ),
  GcdsIcon: ({ name, size, className }) => (
    <div
      data-testid="warning-icon"
      data-icon-name={name}
      data-icon-size={size}
      className={className}
    />
  ),
  GcdsInput: ({ inputId, ...props }) => {
    const { name, type, value, onChange, ...domProps } = props;
    return (
      <input
        {...domProps}
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        data-testid={props["data-testid"]}
      />
    );
  },
  GcdsContainer: ({ children, marginTop, marginBottom, ...props }) => {
    const style = {
      ...(marginTop && { marginTop }),
      ...(marginBottom && { marginBottom }),
      ...props.style,
    };
    return (
      <div {...props} style={style}>
        {children}
      </div>
    );
  },
  GcdsGrid: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsHeading: ({ marginTop, marginBottom, children, ...props }) => (
    <h1
      {...props}
      style={{
        marginTop: marginTop,
        marginBottom: marginBottom,
        ...props.style,
      }}
    >
      {children}
    </h1>
  ),
  GcdsDetails: ({ children, ...props }) => (
    <details {...props}>{children}</details>
  ),
  GcdsNotice: ({ children }) => <div>{children}</div>,
  GcdsLink: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

vi.mock("../../../utils/functions.jsx", () => ({
  getPageContent: vi.fn(() => ({
    1: "Hello",
    2: "Profile Updated Successfully",
    3: "What's next?",
    4: "Your profile information has been updated.",
    5: "You can now continue using our services or",
    6: "Back to Profile",
    7: "Sign Out",
    8: "learn more about our services",
    12: "Signing out...",
    13: "Error signing out. Redirecting...",
  })),
}));

vi.mock("../../../utils/constants.jsx", () => ({
  PAGES: {
    ProfileHome: "profile-home",
    profileUpdateName: "profile-update-name",
    profileUpdateNameSuccess: "profile-update-name-success",
  },
  EXTERNAL_NAVIGATION_LINKS: {
    gcAccountDirectory:
      "https://www.canada.ca/en/government/sign-in-online-account.html",
  },
}));

vi.mock("../../../utils/routeHelpers.js", () => ({
  path: (page, params) => `/${params.language}/${page}`,
}));

vi.mock("../../../services/authService.jsx", () => ({
  authService: {
    logout: vi.fn(() =>
      Promise.resolve({
        data: { redirect_url: "https://mock-logout-success.example.com" },
      }),
    ),
  },
}));

vi.mock("../../../utils/userProfileDispatch.jsx", () => ({
  userProfileDispatch: () => ({ setLoading: mockSetLoading }),
}));

// Import useUser after the mock is defined
import { useUser } from "../../../components/Providers/useUser.tsx";

describe("SuccessfullyUpdatedName", () => {
  const mockOnBackToProfile = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset the useUser mock to default state
    vi.mocked(useUser).mockReturnValue({
      state: mockUserState,
      dispatch: mockDispatch,
    });

    delete window.location;
    window.location = {
      _href: "",
      set href(value) {
        this._href = value;
      },
      get href() {
        return this._href;
      },
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders correctly with nameFormData prop", () => {
    const props = {
      nameFormData: { formatted: "John Doe" },
      onBackToProfile: mockOnBackToProfile,
    };

    render(
      <TestWrapper>
        <SuccessfullyUpdatedName {...props} />
      </TestWrapper>,
    );

    // Check for the name in the success message (rendered together in strong tag)
    expect(screen.getByText(/Hello\s+John Doe/)).toBeInTheDocument();
    expect(
      screen.getByText("Profile Updated Successfully"),
    ).toBeInTheDocument();
    expect(screen.getByText("Sign Out")).toBeInTheDocument();
    expect(screen.getByText("Back to Profile")).toBeInTheDocument();
  });

  it("renders with empty name when nameFormData is null", () => {
    const props = {
      nameFormData: null,
      onBackToProfile: mockOnBackToProfile,
    };

    render(
      <TestWrapper>
        <SuccessfullyUpdatedName {...props} />
      </TestWrapper>,
    );

    // Should render with "Hello " (empty username)
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(
      screen.getByText("Profile Updated Successfully"),
    ).toBeInTheDocument();
  });

  it("renders with empty name when nameFormData.formatted is undefined", () => {
    const props = {
      nameFormData: { formatted: undefined },
      onBackToProfile: mockOnBackToProfile,
    };

    render(
      <TestWrapper>
        <SuccessfullyUpdatedName {...props} />
      </TestWrapper>,
    );

    // Should render with "Hello " (empty username)
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(
      screen.getByText("Profile Updated Successfully"),
    ).toBeInTheDocument();
  });

  it("calls onBackToProfile when Back to Profile button is clicked", async () => {
    const props = {
      nameFormData: { formatted: "John Doe" },
      onBackToProfile: mockOnBackToProfile,
    };

    render(
      <TestWrapper>
        <SuccessfullyUpdatedName {...props} />
      </TestWrapper>,
    );

    const backButton = screen.getByText("Back to Profile");

    await act(async () => {
      backButton.click();
    });

    expect(mockOnBackToProfile).toHaveBeenCalledTimes(1);
  });

  it("calls authService.logout when Sign Out button is clicked", async () => {
    const props = {
      nameFormData: { formatted: "John Doe" },
      onBackToProfile: mockOnBackToProfile,
    };

    render(
      <TestWrapper>
        <SuccessfullyUpdatedName {...props} />
      </TestWrapper>,
    );

    const signOutButton = screen.getByText("Sign Out");

    await act(async () => {
      signOutButton.click();
    });

    expect(mockSetLoading).toHaveBeenCalledWith(true, "Signing out...");
  });

  it("handles logout success and redirects", async () => {
    const props = {
      nameFormData: { formatted: "John Doe" },
      onBackToProfile: mockOnBackToProfile,
    };

    render(
      <TestWrapper>
        <SuccessfullyUpdatedName {...props} />
      </TestWrapper>,
    );

    const signOutButton = screen.getByText("Sign Out");

    await act(async () => {
      signOutButton.click();
    });

    // Wait for the logout to complete
    await act(async () => {
      vi.runAllTimers();
    });

    expect(window.location.href).toBe(
      "https://mock-logout-success.example.com",
    );
  });

  it("handles logout error gracefully", async () => {
    // Mock authService.logout to throw an error
    const mockAuthService = await import("../../../services/authService.jsx");
    vi.mocked(mockAuthService.authService.logout).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const props = {
      nameFormData: { formatted: "John Doe" },
      onBackToProfile: mockOnBackToProfile,
    };

    render(
      <TestWrapper>
        <SuccessfullyUpdatedName {...props} />
      </TestWrapper>,
    );

    const signOutButton = screen.getByText("Sign Out");

    await act(async () => {
      signOutButton.click();
    });

    // Wait for error handling
    await act(async () => {
      vi.runAllTimers();
    });

    expect(mockSetLoading).toHaveBeenCalledWith(
      true,
      "Error signing out. Redirecting...",
    );
  });

  it("renders with different name formats correctly", () => {
    const props = {
      nameFormData: { formatted: "Jane Marie Smith" },
      onBackToProfile: mockOnBackToProfile,
    };

    render(
      <TestWrapper>
        <SuccessfullyUpdatedName {...props} />
      </TestWrapper>,
    );

    expect(screen.getByText(/Hello\s+Jane Marie Smith/)).toBeInTheDocument();
  });
});
