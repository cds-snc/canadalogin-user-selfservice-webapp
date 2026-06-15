import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ConfirmIdentityDetails from "../ConfirmIdentityDetails";

const mockNavigate = vi.fn();
let mockDevOnlyFeature = true;
let mockUserState = {
  userProfile: {
    userName: "test@example.com",
    phoneNumbers: [{ value: "+16135551234", type: "mobile" }],
    name: {
      formatted: "Jane Doe",
    },
  },
};

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../components/Providers/useUser", () => ({
  useUser: () => ({
    state: mockUserState,
    dispatch: vi.fn(),
  }),
}));

vi.mock("../../../utils/constants", () => ({
  get DEV_ONLY_FEATURE() {
    return mockDevOnlyFeature;
  },
  PAGES: {
    editProfileNamePage: "EditProfileNamePage",
    editEmailPage: "EditEmailPage",
    editContactPhoneNumberPage: "EditContactPhoneNumberPage",
    idvStartIdentityProofingPage: "IdvStartIdentityProofingPage",
  },
}));

vi.mock("../../../utils/routeHelpers", () => ({
  path: (pageId, params) => `/${params.language}/${pageId}`,
}));

vi.mock("../../LanguagePreference/components/ViewLanguagePreference", () => ({
  default: () => <div>Language preferences</div>,
}));

vi.mock("../../../components/Badges/VerifiedBadge", () => ({
  default: ({ text }) => <div data-testid="verified-badge">{text}</div>,
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children, role }) => <div role={role}>{children}</div>,
  GcdsGrid: ({ children }) => <div>{children}</div>,
  GcdsHeading: ({ children, tag }) => {
    const Tag = tag ?? "h2";
    return <Tag>{children}</Tag>;
  },
  GcdsText: ({ children }) => <p>{children}</p>,
  GcdsLink: ({ children, href, onGcdsClick }) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onGcdsClick?.({
          preventDefault: vi.fn(),
          detail: href,
        });
      }}
    >
      {children}
    </a>
  ),
  GcdsButton: ({ children, onGcdsClick, buttonRole }) => (
    <button
      data-testid={buttonRole === "secondary" ? "secondary-button" : "button"}
      onClick={(event) => onGcdsClick?.(event)}
    >
      {children}
    </button>
  ),
}));

describe("ConfirmIdentityDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDevOnlyFeature = true;
    mockUserState = {
      userProfile: {
        userName: "test@example.com",
        phoneNumbers: [{ value: "+16135551234", type: "mobile" }],
        name: {
          formatted: "Jane Doe",
        },
      },
    };
  });

  it("renders nothing when DEV_ONLY_FEATURE is false", () => {
    mockDevOnlyFeature = false;

    const { container } = render(<ConfirmIdentityDetails />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the core page sections", () => {
    render(<ConfirmIdentityDetails />);

    expect(
      screen.getByRole("heading", {
        name: "Confirm what will be saved to your CanadaLogin",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Identity proofing details" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Contact info" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Communication" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("This name is used for display purposes only"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("This email is used for signing in and contacting you:"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This number is used for 2-step verification and contacting you:",
      ),
    ).toBeInTheDocument();
  });

  it("shows verified badges when name, email, and phone exist", () => {
    render(<ConfirmIdentityDetails />);

    expect(screen.getAllByTestId("verified-badge")).toHaveLength(3);
  });

  it("shows verified badge only for existing values", () => {
    mockUserState = {
      userProfile: {
        userName: "",
        phoneNumbers: [],
        name: {
          formatted: "Jane Doe",
        },
      },
    };

    render(<ConfirmIdentityDetails />);

    expect(screen.getAllByTestId("verified-badge")).toHaveLength(1);
  });

  it("navigates to start identity proofing when Update information is clicked", () => {
    render(<ConfirmIdentityDetails />);

    fireEvent.click(screen.getByRole("button", { name: "Update information" }));

    expect(mockNavigate).toHaveBeenCalledWith("/en/IdvStartIdentityProofingPage");
  });

  it("navigates with empty destination when Confirm and continue is clicked", () => {
    render(<ConfirmIdentityDetails />);

    fireEvent.click(screen.getByRole("button", { name: "Confirm and continue" }));

    expect(mockNavigate).toHaveBeenCalledWith("");
  });
});
