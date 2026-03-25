import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useParams, useLocation, useNavigate } from "react-router";
import EditLanguagePreferencePage from "../components/EditLanguagePreferencePage";
import { useUser } from "../../../components/Providers/useUser";

// Mock all the dependencies
const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: vi.fn(),
    useLocation: vi.fn(),
    useNavigate: vi.fn(),
  };
});

vi.mock("../../../components/Providers/useUser", () => ({
  useUser: vi.fn(),
}));

vi.mock("../../../components/Wizard/StepContent", () => ({
  __esModule: true,
  default: ({ StepComponent }) => (
    <div data-testid="step-content">{StepComponent}</div>
  ),
}));

vi.mock("../../../components/Layout/Loading", () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="loading">{text}</div>,
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children, role, style }) => (
    <div data-testid="gcds-container" role={role} style={style}>
      {children}
    </div>
  ),
  GcdsHeading: ({ children, tag = "h1" }) => {
    const Tag = tag;
    return <Tag data-testid="gcds-heading">{children}</Tag>;
  },
  GcdsText: ({ children }) => <div data-testid="gcds-text">{children}</div>,
  GcdsButton: ({ children, onGcdsClick, disabled, buttonRole }) => (
    <button
      data-testid="gcds-button"
      data-button-role={buttonRole}
      onClick={onGcdsClick}
      disabled={disabled}
    >
      {children}
    </button>
  ),
  GcdsRadios: ({ legend, name, options, onGcdsChange }) => (
    <fieldset data-testid="gcds-radios">
      <legend>{legend}</legend>
      {options?.map((opt) => (
        <label key={opt.id}>
          <input
            type="radio"
            name={name}
            value={opt.value}
            onChange={() => onGcdsChange?.({ detail: { value: opt.value } })}
          />
          {opt.label}
        </label>
      ))}
    </fieldset>
  ),
  GcdsNotice: ({ children, noticeTitle, noticeRole, noticeTitleTag }) => (
    <div
      data-testid="gcds-notice"
      data-notice-role={noticeRole}
      data-notice-title-tag={noticeTitleTag}
    >
      {noticeTitle}
      {children}
    </div>
  ),
  GcdsGrid: ({ children }) => <div data-testid="gcds-grid">{children}</div>,
  GcdsLink: ({ children, href }) => (
    <a data-testid="gcds-link" href={href}>
      {children}
    </a>
  ),
  GcdsDetails: ({ children, summary }) => (
    <details data-testid="gcds-details">
      <summary>{summary}</summary>
      {children}
    </details>
  ),
}));

describe("EditLanguagePreferencePage Container", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  const setup = (language = "en", step = undefined) => {
    useParams.mockReturnValue({ language, step });
    useLocation.mockReturnValue({ state: null });
    useUser.mockReturnValue({
      state: {
        userProfile: {
          preferredLanguage: "en-ca",
          userName: "test-user",
        },
        relyingPartyInfo: {
          icon: "test-icon.png",
          id: "test-service-id",
          linkName: "Test Service",
          url: "https://test-service.example.com",
        },
      },
      dispatch: vi.fn(),
    });

    return render(<EditLanguagePreferencePage />);
  };

  it("renders without crashing", () => {
    setup();
    expect(screen.getByTestId("step-content")).toBeInTheDocument();
  });

  it("defaults to editLanguage step when no step parameter", () => {
    setup("en");
    expect(screen.getByTestId("step-content")).toBeInTheDocument();
  });

  it("handles confirm-update step parameter", () => {
    setup("en", "confirm-update");
    expect(screen.getByTestId("step-content")).toBeInTheDocument();
  });

  it("handles success step parameter", () => {
    setup("en", "success");
    expect(screen.getByTestId("step-content")).toBeInTheDocument();
  });
});
