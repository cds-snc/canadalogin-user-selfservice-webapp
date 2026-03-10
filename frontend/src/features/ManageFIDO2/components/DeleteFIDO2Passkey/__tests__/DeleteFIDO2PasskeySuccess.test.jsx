/**
 * Unit tests for DeleteFIDO2PasskeySuccess component
 *
 * Tests verify component behaviour:
 * - Renders heading and body text
 * - Renders the NoticeFactory block
 * - Displays the passkey nickname from location.state when present
 * - Renders the "next" action button
 * - Calls onNext when the button is clicked
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import DeleteFIDO2PasskeySuccess from "../DeleteFIDO2PasskeySuccess";

vi.mock("react-router", () => ({
  useParams: () => ({ language: "en" }),
  useLocation: () => ({ state: { passkeyNickname: "My Test Passkey" } }),
}));

vi.mock("../../../../../utils/functions", () => ({
  getPageContent: () => ({
    1: "Passkey deleted",
    2: "Your passkey",
    3: "has been removed",
    4: "You can still sign in using another method.",
    5: "Back to security settings",
  }),
}));

vi.mock("../../../../../utils/constants", () => ({
  PAGES: {
    deleteFIDO2PasskeySuccess: "DeleteFIDO2PasskeySuccess",
  },

  SERVICES: [],
  VITE_ENVIRONMENTS: { dev: "development", test: "test" },
  DEV_ONLY_FEATURE: false,
}));

vi.mock("../../../../../components/InfoBlocks/NoticeFactory", () => ({
  default: ({ noticeType, passkeyName }) => (
    <div data-testid="notice-factory" data-notice-type={noticeType}>
      {passkeyName}
    </div>
  ),
}));

vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsContainer: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsGrid: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsHeading: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
  GcdsText: ({ children, ...props }) => <p {...props}>{children}</p>,
  GcdsButton: ({ children, onGcdsClick, ...props }) => (
    <button onClick={onGcdsClick} {...props}>
      {children}
    </button>
  ),
}));

describe("DeleteFIDO2PasskeySuccess", () => {
  const onNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the success heading", () => {
    render(<DeleteFIDO2PasskeySuccess onNext={onNext} />);
    expect(screen.getByText("Passkey deleted")).toBeInTheDocument();
  });

  it("renders body text", () => {
    render(<DeleteFIDO2PasskeySuccess onNext={onNext} />);
    expect(screen.getByText("has been removed")).toBeInTheDocument();
    expect(
      screen.getByText("You can still sign in using another method."),
    ).toBeInTheDocument();
  });

  it("renders the NoticeFactory with passkeyDeleted type", () => {
    render(<DeleteFIDO2PasskeySuccess onNext={onNext} />);
    expect(screen.getByTestId("notice-factory")).toHaveAttribute(
      "data-notice-type",
      "passkeyDeleted",
    );
  });

  it("passes the passkey nickname to NoticeFactory from location state", () => {
    render(<DeleteFIDO2PasskeySuccess onNext={onNext} />);
    expect(screen.getByTestId("notice-factory")).toHaveTextContent(
      "My Test Passkey",
    );
  });

  it("renders the navigation button", () => {
    render(<DeleteFIDO2PasskeySuccess onNext={onNext} />);
    expect(screen.getByText("Back to security settings")).toBeInTheDocument();
  });

  it("calls onNext when the button is clicked", async () => {
    render(<DeleteFIDO2PasskeySuccess onNext={onNext} />);
    await userEvent.click(screen.getByText("Back to security settings"));
    expect(onNext).toHaveBeenCalledOnce();
  });
});
