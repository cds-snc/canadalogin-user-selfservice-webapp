import "@testing-library/jest-dom/vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ServiceCanadaCentrePage from "../InPerson/ServiceCanadaCentrePage";
import i18n from "../../../i18n/test";
import {
  getFirstNameRequiredOrInvalidMessage,
  getIdTypeRequiredMessage,
  getSharedDateOfBirthMessages,
  getValidationSummaryHeading,
} from "../InPerson/validation/ErrorsDefinition";

// ────────────────────────────────────────────────
// Mocks
// ────────────────────────────────────────────────
const mockNavigate = vi.fn();
const mockRouteParams = vi.hoisted(() => ({ language: "en" }));
const mockFlags = vi.hoisted(() => ({
  devOnlyFeature: true,
}));
const mockSendInPersonVerificationCode = vi.hoisted(() => vi.fn());
const MOCK_GENERATED_VERIFICATION_CODE = "ZX91AB34CD";

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => mockRouteParams,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../components/Providers/useUser", () => ({
  useUser: () => ({
    state: {
      userProfile: {
        userName: "test@example.com",
      },
    },
    dispatch: vi.fn(),
  }),
}));

vi.mock("../api/inPersonIdentityVerificationApi", async () => {
  const actual = await vi.importActual(
    "../api/inPersonIdentityVerificationApi",
  );
  return {
    ...actual,
    inPersonIdentityVerificationApi: {
      sendInPersonVerificationCode: mockSendInPersonVerificationCode,
    },
  };
});

vi.mock("../../../utils/constants", async () => {
  const actual = await vi.importActual("../../../utils/constants");
  return {
    ...actual,
    get DEV_ONLY_FEATURE() {
      return mockFlags.devOnlyFeature;
    },
    PAGES: {
      ...actual.PAGES,
    },
  };
});

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsGrid: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsHeading: ({ children, tag }) => {
    const Tag = tag ?? "h2";
    return <Tag>{children}</Tag>;
  },
  GcdsFieldset: ({ children, legend }) => (
    <fieldset>
      <legend>{legend}</legend>
      {children}
    </fieldset>
  ),
  GcdsText: ({ children, ...props }) => <p {...props}>{children}</p>,
  GcdsErrorSummary: ({ id, heading, errorLinks }) => (
    <div id={id} data-testid="error-summary">
      <h2>{heading}</h2>
      {Object.entries(errorLinks ?? {}).map(([href, message], index) => (
        <a key={index} href={href}>
          {message}
        </a>
      ))}
    </div>
  ),
  GcdsErrorMessage: ({ children }) => <div>{children}</div>,
  GcdsButton: ({ children, onClick, buttonRole, disabled, ...props }) => (
    <button
      data-testid={
        buttonRole === "secondary" ? "back-button" : "continue-button"
      }
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
  GcdsSelect: ({
    children,
    label,
    name,
    selectId,
    required,
    value,
    defaultValue,
    errorMessage,
    onGcdsChange,
    ...props
  }) => {
    // For controlled components with defaultValue, we need to use the value if provided
    // Otherwise use defaultValue. If required and value equals defaultValue, treat as invalid.
    const selectValue = value !== undefined ? value : defaultValue;
    return (
      <>
        <label htmlFor={selectId}>{label}</label>
        <select
          id={selectId}
          name={name}
          data-testid={selectId}
          required={required}
          value={selectValue}
          defaultValue={defaultValue}
          onChange={(e) => {
            onGcdsChange?.({ target: e.target });
          }}
          {...props}
        >
          {children}
        </select>
        {errorMessage ? <div>{errorMessage}</div> : null}
      </>
    );
  },
  GcdsInput: ({
    inputId,
    label,
    required,
    name,
    errorMessage,
    onGcdsChange,
    ...props
  }) => (
    <>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        name={name}
        required={required}
        data-testid={inputId}
        onChange={(e) => {
          onGcdsChange?.({ target: e.target });
        }}
        {...props}
      />
      {errorMessage ? <div>{errorMessage}</div> : null}
    </>
  ),
  GcdsDateInput: ({
    legend,
    name,
    required,
    errorMessage,
    onGcdsChange,
    ...props
  }) => (
    <>
      <label htmlFor={name}>{legend}</label>
      <input
        id={name}
        name={name}
        required={required}
        data-testid={name}
        onChange={(e) => {
          onGcdsChange?.({ target: e.target });
        }}
        {...props}
      />
      {errorMessage ? <div>{errorMessage}</div> : null}
    </>
  ),
  GcdsLink: ({ children, href }) => <a href={href}>{children}</a>,
  GcdsNotice: ({ children, noticeTitle }) => (
    <div data-testid="gcds-notice">
      <span>{noticeTitle}</span>
      {children}
    </div>
  ),
}));

// ────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────
describe("ServiceCanadaCentrePage", () => {
  const t = i18n.getFixedT("en", "idv");

  beforeEach(() => {
    vi.clearAllMocks();
    mockFlags.devOnlyFeature = true;
    mockRouteParams.language = "en";
    mockSendInPersonVerificationCode.mockResolvedValue({
      success: true,
      message: "In-person verification email sent",
      data: {
        verificationCode: MOCK_GENERATED_VERIFICATION_CODE,
      },
    });
    i18n.changeLanguage("en");
  });

  afterEach(() => {
    i18n.changeLanguage("en");
  });

  it("renders the page heading and only selectId on initial mount", () => {
    render(<ServiceCanadaCentrePage />);

    expect(
      screen.getByRole("heading", {
        name: "Get ready to visit a Service Canada Centre",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("selectId")).toBeInTheDocument();
    expect(
      screen.queryByTestId("id-expiration-date-input"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("first-name-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("last-name-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("date-of-birth-input")).not.toBeInTheDocument();
    expect(screen.getByTestId("continue-button")).toBeInTheDocument();
    expect(screen.getByTestId("back-button")).toBeInTheDocument();
  });

  it("renders the rest of the form once an ID is selected", () => {
    render(<ServiceCanadaCentrePage />);

    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "passport" },
    });

    expect(screen.getByTestId("id-expiration-date-input")).toBeInTheDocument();
    expect(screen.getByTestId("first-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("last-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("date-of-birth-input")).toBeInTheDocument();
  });

  it("hides address and province fields until a qualifying ID is selected", () => {
    render(<ServiceCanadaCentrePage />);

    expect(screen.queryByTestId("address-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("select-province")).not.toBeInTheDocument();
  });

  it("shows address and province fields for driver's licence", () => {
    render(<ServiceCanadaCentrePage />);

    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "driverLicence" },
    });

    expect(screen.getByTestId("address-input")).toBeInTheDocument();
    expect(screen.getByTestId("select-province")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Alberta" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Yukon" })).toBeInTheDocument();
  });

  it("does not show address and province fields for passport", () => {
    render(<ServiceCanadaCentrePage />);

    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "passport" },
    });

    expect(screen.queryByTestId("address-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("select-province")).not.toBeInTheDocument();
  });

  it("calls in-person verification API and navigates to the next page when form is valid", async () => {
    render(<ServiceCanadaCentrePage />);

    const continueButton = screen.getByTestId("continue-button");
    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "passport" },
    });
    fireEvent.change(screen.getByTestId("id-expiration-date-input"), {
      target: { value: "2026-12-31" },
    });
    fireEvent.change(screen.getByTestId("first-name-input"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByTestId("last-name-input"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByTestId("date-of-birth-input"), {
      target: { value: "1990-01-01" },
    });

    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(mockSendInPersonVerificationCode).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(
        "/en/identity-verification/in-person/service-canada-centre/idv-code",
        expect.objectContaining({
          state: expect.objectContaining({
            idvCode: MOCK_GENERATED_VERIFICATION_CODE,
            firstName: "Jane",
            lastName: "Doe",
            dateOfBirth: "1990-01-01",
            idType: "passport",
            idExpiryDate: "2026-12-31",
          }),
        }),
      );
    });
  });

  it("shows the error summary and inline error when submitted without selecting an ID", async () => {
    render(<ServiceCanadaCentrePage />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("continue-button"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("error-summary")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("heading", {
        name: getValidationSummaryHeading(t),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(getIdTypeRequiredMessage(t)).length,
    ).toBeGreaterThan(1);
    expect(mockSendInPersonVerificationCode).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows DOB and name validation errors and does not navigate when submitted with invalid fields", async () => {
    render(<ServiceCanadaCentrePage />);

    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "passport" },
    });
    fireEvent.change(screen.getByTestId("id-expiration-date-input"), {
      target: { value: "2026-12-31" },
    });
    fireEvent.change(screen.getByTestId("first-name-input"), {
      target: { value: "Jane123" },
    });
    fireEvent.change(screen.getByTestId("last-name-input"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByTestId("date-of-birth-input"), {
      target: { value: "1990-02-31" },
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("continue-button"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("error-summary")).toBeInTheDocument();
    });

    const dobInvalidMessage = getSharedDateOfBirthMessages(t).invalid.summary;

    expect(
      screen.getAllByText(getFirstNameRequiredOrInvalidMessage(t)).length,
    ).toBeGreaterThan(1);
    expect(screen.getAllByText(dobInvalidMessage).length).toBeGreaterThan(1);
    expect(mockSendInPersonVerificationCode).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("calls navigate(-1) when Back button is clicked", () => {
    render(<ServiceCanadaCentrePage />);

    fireEvent.click(screen.getByTestId("back-button"));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("renders French province labels when language is fr", async () => {
    mockRouteParams.language = "fr";
    await i18n.changeLanguage("fr");

    render(<ServiceCanadaCentrePage />);
    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "driverLicence" },
    });

    expect(
      screen.getByRole("option", { name: "Colombie-Britannique" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Québec" })).toBeInTheDocument();
  });

  it("renders nothing when DEV_ONLY_FEATURE is false", () => {
    mockFlags.devOnlyFeature = false;

    const { container } = render(<ServiceCanadaCentrePage />);

    expect(container).toBeEmptyDOMElement();
  });
});
