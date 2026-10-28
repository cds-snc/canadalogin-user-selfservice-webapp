import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ContinueProofingOnMobile from "../Online/ContinueProofingOnMobile";
import IdentityVerificationSuccess from "../Online/IdentityVerificationSuccess";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  language: "en",
  journeyType: "required",
  enabled: true,
  state: undefined,
}));

vi.mock("react-router", async () => ({
  ...(await vi.importActual("react-router")),
  useNavigate: () => mocks.navigate,
  useParams: () => ({
    language: mocks.language,
    journeyType: mocks.journeyType,
  }),
  useLocation: () => ({ state: mocks.state }),
}));

vi.mock("../../../utils/constants", async () => ({
  ...(await vi.importActual("../../../utils/constants")),
  get DEV_ONLY_FEATURE() {
    return mocks.enabled;
  },
}));

vi.mock("../../../utils/routeHelpers", () => ({
  path: (page, { language, journeyType }) =>
    `/${language}/identity-verification/${journeyType}/${page}`,
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children, role }) => <div role={role}>{children}</div>,
  GcdsGrid: ({ children }) => <div>{children}</div>,
  GcdsHeading: ({ children, tag }) => {
    const Tag = tag;
    return <Tag>{children}</Tag>;
  },
  GcdsText: ({ children, role }) => <p role={role}>{children}</p>,
  GcdsLink: ({ children, onGcdsClick, ...props }) => (
    <a {...props} onClick={onGcdsClick}>
      {children}
    </a>
  ),
  GcdsButton: ({ children, buttonRole, ...props }) => (
    <button {...props} data-button-role={buttonRole}>
      {children}
    </button>
  ),
  GcdsNotice: ({ children, noticeTitle }) => (
    <aside>
      {noticeTitle}
      {children}
    </aside>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.enabled = true;
  mocks.state = undefined;
  mocks.language = "en";
  mocks.journeyType = "required";
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ContinueProofingOnMobile", () => {
  it("immediately renders a dummy QR code and placeholder link", () => {
    const { container } = render(<ContinueProofingOnMobile />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://canadalogin.ca/prove/daUf30fn2/",
    );
    expect(screen.getByRole("img")).toHaveAccessibleName(
      "Example identity proofing QR code",
    );
    expect(container.querySelector("svg path")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("places primary Copy link beside the link and the approval actions below", () => {
    render(<ContinueProofingOnMobile />);
    const link = screen.getByRole("link");
    const copy = screen.getByRole("button", { name: "Copy link" });
    const continueButton = screen.getByRole("button", { name: "Continue" });
    const differentMethod = screen.getByRole("button", {
      name: "Choose a different method",
    });

    expect(link).toHaveTextContent("canadalogin.ca/prove/daUf30fn2/");
    expect(link.parentElement).toBe(copy.parentElement);
    expect(link.nextElementSibling).toBe(copy);
    expect(copy).toHaveAttribute("data-button-role", "primary");
    expect(continueButton).toHaveAttribute("data-button-role", "primary");
    expect(differentMethod).toHaveAttribute("data-button-role", "secondary");
    expect(continueButton.nextElementSibling).toBe(differentMethod);
    expect(
      copy.compareDocumentPosition(continueButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("only approves on Continue, not when the dummy link is clicked or time passes", async () => {
    vi.useFakeTimers();
    render(<ContinueProofingOnMobile />);
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    expect(fireEvent(screen.getByRole("link"), event)).toBe(false);
    expect(event.defaultPrevented).toBe(true);
    await act(async () => vi.advanceTimersByTimeAsync(60000));
    expect(mocks.navigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith(
      "/en/identity-verification/required/IdvIdentityVerificationSuccessPage",
      { state: { mockProofing: true } },
    );
  });

  it("preserves the language and journey when continuing", () => {
    mocks.language = "fr";
    mocks.journeyType = "update";
    render(<ContinueProofingOnMobile />);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(mocks.navigate).toHaveBeenCalledWith(
      "/fr/identity-verification/update/IdvIdentityVerificationSuccessPage",
      { state: { mockProofing: true } },
    );
  });

  it("copies the dummy link without showing a confirmation or approving", async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(<ContinueProofingOnMobile />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    });
    expect(writeText).toHaveBeenCalledWith(
      "https://canadalogin.ca/prove/daUf30fn2/",
    );
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(screen.queryByText("Link copied.")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows a visible copy error without blocking Continue", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    render(<ContinueProofingOnMobile />);
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Select and copy the link above instead.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(mocks.navigate).toHaveBeenCalledWith(
      "/en/identity-verification/required/IdvIdentityVerificationSuccessPage",
      { state: { mockProofing: true } },
    );
  });

  it("allows choosing another method immediately", () => {
    render(<ContinueProofingOnMobile />);
    fireEvent.click(
      screen.getByRole("button", { name: "Choose a different method" }),
    );
    expect(mocks.navigate).toHaveBeenCalledWith(
      "/en/identity-verification/required/IdvProveIdentityOnlinePage",
    );
  });

  it("is unavailable when development features are disabled", () => {
    mocks.enabled = false;
    const { container } = render(<ContinueProofingOnMobile />);
    expect(container).toBeEmptyDOMElement();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});

describe("IdentityVerificationSuccess", () => {
  it("preserves the mock journey when continuing to review details", () => {
    mocks.state = { mockProofing: true };
    render(<IdentityVerificationSuccess />);
    fireEvent.click(screen.getByRole("button"));
    expect(mocks.navigate).toHaveBeenCalledWith(
      "/en/identity-verification/required/IdvDetailsConfirmationPage",
      { state: { mockProofing: true } },
    );
  });

  it("does not inject mock details into other verification journeys", () => {
    render(<IdentityVerificationSuccess />);
    fireEvent.click(screen.getByRole("button"));
    expect(mocks.navigate).toHaveBeenCalledWith(
      "/en/identity-verification/required/IdvDetailsConfirmationPage",
      undefined,
    );
  });
});
