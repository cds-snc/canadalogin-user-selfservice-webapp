import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProvincialLinkedPage from "../Online/ProvincialLinkedPage";

const mockNavigate = vi.fn();
let mockDevOnlyFeature = true;

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ language: "en", journeyType: "update" }),
  };
});

vi.mock("../../../utils/routeHelpers", () => ({
  path: (_page, { language, journeyType } = {}) => {
    return `/${language ?? "en"}/identity-verification/${journeyType ?? "start"}/online/bluink/confirmation`;
  },
}));

vi.mock("../../../utils/constants", () => ({
  get DEV_ONLY_FEATURE() {
    return mockDevOnlyFeature;
  },
  PAGES: {
    idvIdentityVerificationSuccessPage: "IdvIdentityVerificationSuccessPage",
  },
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }) => <div>{children}</div>,
  GcdsGrid: ({ children }) => <div>{children}</div>,
  GcdsHeading: ({ children, tag }) => {
    const Tag = tag ?? "h2";
    return <Tag>{children}</Tag>;
  },
  GcdsNotice: ({ children, noticeTitle }) => (
    <div data-testid="gcds-notice">
      <span>{noticeTitle}</span>
      {children}
    </div>
  ),
  GcdsText: ({ children }) => <p>{children}</p>,
  GcdsButton: ({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

describe("ProvincialLinkedPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDevOnlyFeature = true;
  });

  it("renders linked heading and notice", () => {
    render(<ProvincialLinkedPage />);

    expect(
      screen.getByRole("heading", {
        name: "Your CanadaLogin account is now connected to your BC Services Card",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("gcds-notice")).toBeInTheDocument();
    expect(screen.getByText("Connection complete")).toBeInTheDocument();
  });

  it("navigates to identity verification success page when Continue is clicked", () => {
    render(<ProvincialLinkedPage />);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/identity-verification/update/online/bluink/confirmation",
    );
  });

  it("renders nothing when DEV_ONLY_FEATURE is false", () => {
    mockDevOnlyFeature = false;

    const { container } = render(<ProvincialLinkedPage />);

    expect(container).toBeEmptyDOMElement();
  });
});
