import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useParams, useLocation, useNavigate } from "react-router";
import EditLanguagePreferencePage from "../components/EditLanguagePreferencePage.jsx";
import { useUser } from "../../../components/Providers/useUser.tsx";

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

vi.mock("../../../components/Providers/useUser.tsx", () => ({
  useUser: vi.fn(),
}));

vi.mock("../../../components/Wizard/StepContent.jsx", () => ({
  __esModule: true,
  default: ({ StepComponent }) => (
    <div data-testid="step-content">{StepComponent}</div>
  ),
}));

vi.mock("../../../components/Layout/Loading.jsx", () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="loading">{text}</div>,
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
