import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom";
import SuccessfullyUpdatedName from "../components/SuccessfullyUpdated.jsx";

const mockNavigate = vi.fn();
const mockSetLoading = vi.fn();
const mockDispatch = vi.fn();

const mockUserState = {
  userProfile: { name: { formatted: "John Doe" } },
};

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ language: "en" }),
    useLocation: vi.fn(),
  };
});

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
  GcdsInput: ({ inputId, validateOn, label, lang, required, ...props }) => {
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
}));

vi.mock("../../../utils/routeHelpers.js", () => ({
  path: (page, params) => `/${params.language}/${page}`,
}));

vi.mock("../../../components/Providers/useUser.tsx", () => ({
  useUser: () => ({
    state: mockUserState,
    dispatch: mockDispatch,
  }),
}));

vi.mock("../../../services/authService.jsx", () => ({
  authService: { logout: vi.fn() },
}));

vi.mock("../../../utils/userProfileDispatch.jsx", () => ({
  userProfileDispatch: () => ({ setLoading: mockSetLoading }),
}));

// 🧪 ---- Tests ----
describe("SuccessfullyUpdatedName", () => {
  let useLocation;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

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

    const reactRouter = await import("react-router");
    useLocation = reactRouter.useLocation;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders correctly when location.state.name exists", () => {
    useLocation.mockReturnValue({ state: { name: "John Doe" } });
    render(<SuccessfullyUpdatedName />);

    expect(screen.getByText("Hello John Doe")).toBeInTheDocument();
    expect(
      screen.getByText("Profile Updated Successfully"),
    ).toBeInTheDocument();
    expect(screen.getByText("Sign Out")).toBeInTheDocument();
  });

  it("redirects to edit page when no state name", () => {
    useLocation.mockReturnValue({ state: null });
    render(<SuccessfullyUpdatedName />);
    expect(mockNavigate).toHaveBeenCalledWith("/en/profile-update-name");
  });

  it("redirects to edit page when empty state", () => {
    useLocation.mockReturnValue({ state: {} });
    render(<SuccessfullyUpdatedName />);
    expect(mockNavigate).toHaveBeenCalledWith("/en/profile-update-name");
  });
});
