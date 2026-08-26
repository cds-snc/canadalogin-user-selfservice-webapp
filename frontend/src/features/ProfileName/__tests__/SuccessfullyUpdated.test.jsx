import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BrowserRouter } from "react-router";
import "@testing-library/jest-dom";
import SuccessfullyUpdatedName from "../components/SuccessfullyUpdated";

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
vi.mock("../../../components/Providers/useUser", () => ({
  useUser: vi.fn(() => ({
    state: mockUserState,
    dispatch: mockDispatch,
  })),
}));

vi.mock("@gcds-core/components-react", () => ({
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
    <div
      {...props}
      style={{
        marginTop: marginTop,
        marginBottom: marginBottom,
        ...props.style,
      }}
    >
      {children}
    </div>
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

vi.mock("../../../utils/constants", () => ({
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

vi.mock("../../../utils/routeHelpers", () => ({
  path: (page, params) => `/${params.language}/${page}`,
}));

vi.mock("../../../services/authService", () => ({
  authService: {
    logout: vi.fn(() =>
      Promise.resolve({
        data: { redirect_url: "https://mock-logout-success.example.com" },
      }),
    ),
  },
}));

vi.mock("../../../utils/userProfileDispatch", () => ({
  userProfileDispatch: () => ({ setLoading: mockSetLoading }),
}));

// Import useUser after the mock is defined
import { useUser } from "../../../components/Providers/useUser";

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

    // The message prefix is plain text while only the username is bolded.
    expect(
      screen.getByText("Your name has been updated to"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("John Doe", { selector: "strong" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("You may need to update your name other places"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "To sync your updated name from your CanadaLogin profile to your connected services, sign in to each service individually.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Government of Canada account directory"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("services that can be accessed using your CanadaLogin"),
    ).toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
    expect(screen.getByText("Back to profile")).toBeInTheDocument();
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

    // Should render with "Your name has been updated to" (empty username)
    expect(
      screen.getByText("Your name has been updated to"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("You may need to update your name other places"),
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

    // Should render with "Your name has been updated to" (empty username)
    expect(
      screen.getByText("Your name has been updated to"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("You may need to update your name other places"),
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

    const backButton = screen.getByText("Back to profile");

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

    const signOutButton = screen.getByText("Sign out");

    await act(async () => {
      signOutButton.click();
    });

    expect(mockSetLoading).toHaveBeenCalledWith(true, "Signing you out...");
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

    const signOutButton = screen.getByText("Sign out");

    await act(async () => {
      signOutButton.click();
    });

    // Wait for the logout to complete
    await act(async () => {
      vi.runAllTimers();
    });

    // Since POST is being used, no more redirect is correct logic
    expect(window.location.href).toBe("");
  });

  it("handles logout error gracefully", async () => {
    // Mock authService.logout to throw an error
    const mockAuthService = await import("../../../services/authService");
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

    const signOutButton = screen.getByText("Sign out");

    await act(async () => {
      signOutButton.click();
    });

    // Wait for error handling
    await act(async () => {
      vi.runAllTimers();
    });

    expect(mockSetLoading).toHaveBeenCalledWith(
      true,
      "Failed to sign you out. Redirecting...",
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

    expect(
      screen.getByText("Your name has been updated to"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Jane Marie Smith", { selector: "strong" }),
    ).toBeInTheDocument();
  });
});
