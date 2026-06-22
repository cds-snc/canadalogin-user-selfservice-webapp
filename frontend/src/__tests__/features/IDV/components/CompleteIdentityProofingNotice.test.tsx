import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CompleteIdentityProofingNotice from "../../../../features/IDV/components/CompleteIdentityProofingNotice";

let mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("react-i18next", async () => {
  const actual = await vi.importActual("react-i18next");
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const translations: Record<string, string> = {
          "CompleteIdentityProofing.noticeTitle": "Get access to more services",
          "CompleteIdentityProofing.noticeDescription":
            "Complete identity proofing to secure your CanadaLogin, make recovery easier, and access more Government of Canada services.",
          "CompleteIdentityProofing.noticeCta": "Complete identity proofing",
        };
        return translations[key] || key;
      },
    }),
  };
});

vi.mock("../../../../utils/routeHelpers", () => ({
  path: (id: string, params: { language?: string }) =>
    `/${params.language ?? "en"}/idv`,
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsNotice: ({
    noticeTitle,
    noticeRole,
    children,
  }: {
    noticeTitle: string;
    noticeRole: string;
    children: React.ReactNode;
  }) => (
    <div role="note" data-notice-role={noticeRole}>
      <h2>{noticeTitle}</h2>
      {children}
    </div>
  ),
  GcdsText: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  GcdsButton: ({
    children,
    onGcdsClick,
    buttonRole,
  }: {
    children: React.ReactNode;
    onGcdsClick: (e: Event) => void;
    buttonRole: string;
  }) => (
    <button
      data-button-role={buttonRole}
      onClick={(e) => onGcdsClick(e as unknown as Event)}
    >
      {children}
    </button>
  ),
}));

describe("CompleteIdentityProofingNotice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate = vi.fn();
  });

  it("renders the notice with correct title", () => {
    render(<CompleteIdentityProofingNotice />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Get access to more services",
    );
  });

  it("renders the notice description text", () => {
    render(<CompleteIdentityProofingNotice />);
    expect(
      screen.getByText(
        /Complete identity proofing to secure your CanadaLogin/,
      ),
    ).toBeInTheDocument();
  });

  it("renders the CTA button with correct text", () => {
    render(<CompleteIdentityProofingNotice />);
    expect(
      screen.getByRole("button", { name: "Complete identity proofing" }),
    ).toBeInTheDocument();
  });

  it("renders the button with secondary role", () => {
    render(<CompleteIdentityProofingNotice />);
    const button = screen.getByRole("button", {
      name: "Complete identity proofing",
    });
    expect(button).toHaveAttribute("data-button-role", "secondary");
  });

  it("renders the notice with info role", () => {
    render(<CompleteIdentityProofingNotice />);
    const notice = screen.getByRole("note");
    expect(notice).toHaveAttribute("data-notice-role", "info");
  });

  it("calls navigate with the IDV start route when button is clicked", () => {
    render(<CompleteIdentityProofingNotice />);
    const button = screen.getByRole("button", {
      name: "Complete identity proofing",
    });

    button.click();

    expect(mockNavigate).toHaveBeenCalledWith("/en/idv");
  });
});
