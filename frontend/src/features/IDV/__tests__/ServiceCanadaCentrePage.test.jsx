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
import ServiceCanadaCentreIdDetailsPage from "../InPerson/ServiceCanadaCentreIdDetailsPage";
import i18n from "../../../i18n/test";

// ────────────────────────────────────────────────
// Mocks
// ────────────────────────────────────────────────
const mockNavigate = vi.fn();
const mockRouteParams = vi.hoisted(() => ({ language: "en" }));
const mockLocationState = vi.hoisted(() => ({ idType: "passport" }));
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
    useLocation: () => ({ state: mockLocationState }),
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
  GcdsRadios: ({
    id,
    legend,
    hint,
    options,
    required,
    errorMessage,
    onGcdsChange,
  }) => (
    <fieldset id={id}>
      <legend>{legend}</legend>
      <p>{hint}</p>
      {options.map(({ id: optionId, value, label, checked }) => (
        <label key={optionId} htmlFor={optionId}>
          <input
            id={optionId}
            type="radio"
            value={value}
            checked={checked}
            required={required}
            onChange={(event) => onGcdsChange?.({ target: event.target })}
          />
          {label}
        </label>
      ))}
      {errorMessage ? <div>{errorMessage}</div> : null}
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
  GcdsButton: ({
    children,
    onClick,
    onGcdsClick,
    buttonRole,
    disabled,
    ...props
  }) => (
    <button
      data-testid={
        buttonRole === "secondary" ? "back-button" : "continue-button"
      }
      onClick={(event) => {
        onClick?.(event);
        onGcdsClick?.(event);
      }}
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
          {defaultValue ? (
            <option value="" disabled>
              {defaultValue}
            </option>
          ) : null}
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
describe("ServiceCanadaCentre pages", () => {
  const t = i18n.getFixedT("en", "idv");

  beforeEach(() => {
    vi.clearAllMocks();
    mockFlags.devOnlyFeature = true;
    mockRouteParams.language = "en";
    mockLocationState.idType = "passport";
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

  it("renders the ID selection screen without the details form", () => {
    render(<ServiceCanadaCentrePage />);

    expect(
      screen.getByRole("heading", {
        name: "Get ready to visit a Service Canada Centre",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /passport/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /driver/i })).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /health card/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /canadian PR card$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("id-expiry-date-input"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("first-name-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("last-name-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("date-of-birth-input")).not.toBeInTheDocument();
    expect(screen.getByTestId("continue-button")).toBeInTheDocument();
    expect(screen.getByTestId("back-button")).toBeInTheDocument();
  });

  it("renders the non-expired ID question and its options", () => {
    render(<ServiceCanadaCentrePage />);

    expect(
      screen.getByRole("group", { name: "Can you bring a non-expired ID?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "ID must be valid when you visit the Service Canada Centre",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Yes" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "No" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Yes" })).toBeRequired();
  });

  it("opens the details form after an ID is selected", () => {
    render(<ServiceCanadaCentrePage />);

    fireEvent.click(screen.getByRole("radio", { name: /passport/i }));
    fireEvent.click(screen.getByRole("radio", { name: "Yes" }));
    fireEvent.click(screen.getByTestId("continue-button"));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/identity-verification/in-person/service-canada-centre/id-details",
      { state: { idType: "passport" } },
    );
    expect(mockSendInPersonVerificationCode).not.toHaveBeenCalled();
  });

  it("requires an answer to the valid-ID question before continuing", async () => {
    render(<ServiceCanadaCentrePage />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("continue-button"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("error-summary")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("heading", {
        name: i18n.getFixedT("en", "common")("Error.genericProblem"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(t("ErrorsDefinition.selectOptionRequired")),
    ).toHaveLength(2);
    expect(mockSendInPersonVerificationCode).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("navigates to the not-ready page when the user cannot bring non-expired ID", async () => {
    render(<ServiceCanadaCentrePage />);

    fireEvent.click(screen.getByRole("radio", { name: "No" }));
    fireEvent.click(screen.getByTestId("continue-button"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining("/not-ready"),
      );
    });
    expect(mockSendInPersonVerificationCode).not.toHaveBeenCalled();
    expect(screen.queryByTestId("error-summary")).not.toBeInTheDocument();
  });

  it("returns to method selection when the user has none of the listed IDs", () => {
    render(<ServiceCanadaCentrePage />);

    fireEvent.click(screen.getByRole("radio", { name: /these IDs/i }));
    fireEvent.click(screen.getByRole("radio", { name: "Yes" }));
    fireEvent.click(screen.getByTestId("continue-button"));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/identity-verification/in-person",
    );
    expect(mockSendInPersonVerificationCode).not.toHaveBeenCalled();
  });

  it("calls navigate(-1) when Back button is clicked", () => {
    render(<ServiceCanadaCentrePage />);

    fireEvent.click(screen.getByTestId("back-button"));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("renders French ID labels when language is fr", async () => {
    mockRouteParams.language = "fr";
    await i18n.changeLanguage("fr");

    render(<ServiceCanadaCentrePage />);
    expect(
      screen.getByRole("radio", { name: /passeport/i }),
    ).toBeInTheDocument();
  });

  it("renders nothing when DEV_ONLY_FEATURE is false", () => {
    mockFlags.devOnlyFeature = false;

    const { container } = render(<ServiceCanadaCentrePage />);

    expect(container).toBeEmptyDOMElement();
  });

  it("validates all details before submitting the Service Canada request", async () => {
    mockLocationState.idType = "passport";
    render(<ServiceCanadaCentreIdDetailsPage />);

    expect(
      screen.getByRole("heading", { name: "Enter your passport details" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("first-name-input")).toHaveAttribute(
      "hint",
      "Must match what is on your official ID",
    );
    expect(
      screen.queryByTestId("id-expiry-date-input"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("select-country")).not.toBeInTheDocument();
    expect(screen.queryByTestId("address-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("city-town-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("select-province")).not.toBeInTheDocument();
    expect(screen.queryByTestId("postal-code-input")).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId("continue-button"));
    });

    expect(screen.getByTestId("error-summary")).toBeInTheDocument();
    expect(mockSendInPersonVerificationCode).not.toHaveBeenCalled();

    fireEvent.change(screen.getByTestId("first-name-input"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByTestId("last-name-input"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByTestId("date-of-birth-input"), {
      target: { value: "1990-01-01" },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("continue-button"));
    });

    await waitFor(() => {
      expect(mockSendInPersonVerificationCode).toHaveBeenCalledWith({
        verificationProvider: "service_canada",
        applicant: {
          firstName: "Jane",
          lastName: "Doe",
          dateOfBirth: "1990-01-01",
          idType: "passport",
        },
      });
      expect(mockNavigate).toHaveBeenCalledWith(
        "/en/identity-verification/in-person/service-canada-centre/idv-code",
        expect.objectContaining({
          state: expect.objectContaining({
            idvCode: MOCK_GENERATED_VERIFICATION_CODE,
            firstName: "Jane",
            lastName: "Doe",
            dateOfBirth: "January 1, 1990",
            idType: "passport",
          }),
        }),
      );
    });
  });

  it("renders and submits address details for a driver licence", async () => {
    mockLocationState.idType = "driverLicence";
    render(<ServiceCanadaCentreIdDetailsPage />);

    expect(
      screen.getByRole("heading", {
        name: "Enter your driver licence details",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("address-input")).toHaveAttribute(
      "hint",
      "Enter your street address",
    );
    expect(screen.getByTestId("city-town-input")).toBeInTheDocument();
    expect(screen.getByTestId("select-province")).toBeInTheDocument();
    expect(
      screen.getAllByRole("option", { name: "Select option" }),
    ).toHaveLength(1);
    expect(screen.getByTestId("postal-code-input")).toHaveAttribute(
      "hint",
      "For example, A1A 1A1",
    );

    fireEvent.change(screen.getByTestId("first-name-input"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByTestId("last-name-input"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByTestId("date-of-birth-input"), {
      target: { value: "1990-01-01" },
    });
    fireEvent.change(screen.getByTestId("address-input"), {
      target: { value: "123 Main Street" },
    });
    fireEvent.change(screen.getByTestId("city-town-input"), {
      target: { value: "Ottawa" },
    });
    fireEvent.change(screen.getByTestId("select-province"), {
      target: { value: "ON" },
    });
    fireEvent.change(screen.getByTestId("postal-code-input"), {
      target: { value: "L5N 6Z9" },
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("continue-button"));
    });

    await waitFor(() => {
      expect(mockSendInPersonVerificationCode).toHaveBeenCalledWith({
        verificationProvider: "service_canada",
        applicant: {
          firstName: "Jane",
          lastName: "Doe",
          dateOfBirth: "1990-01-01",
          address: {
            streetAddress: "123 Main Street",
            locality: "Ottawa",
            region: "ON",
            postalCode: "L5N 6Z9",
            country: "CA",
          },
          idType: "driverLicence",
        },
      });
    });
  });

  it("omits expiry date for other IDs with optional address fields", async () => {
    mockLocationState.idType = "photoIDHealthCard";
    render(<ServiceCanadaCentreIdDetailsPage />);

    expect(
      screen.getByRole("heading", { name: "Enter your ID details" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("id-expiry-date-input"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("select-country")).not.toBeInTheDocument();
    expect(screen.getByTestId("address-input")).not.toBeRequired();
    expect(screen.getByTestId("city-town-input")).not.toBeRequired();
    expect(screen.getByTestId("select-province")).not.toBeRequired();
    expect(screen.getByTestId("postal-code-input")).not.toBeRequired();
    expect(screen.getByTestId("first-name-input")).toHaveAttribute(
      "hint",
      "Must match what is on your official ID",
    );

    fireEvent.change(screen.getByTestId("first-name-input"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByTestId("last-name-input"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByTestId("date-of-birth-input"), {
      target: { value: "1990-01-01" },
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("continue-button"));
    });

    await waitFor(() => {
      expect(mockSendInPersonVerificationCode).toHaveBeenCalledWith({
        verificationProvider: "service_canada",
        applicant: {
          firstName: "Jane",
          lastName: "Doe",
          dateOfBirth: "1990-01-01",
          idType: "photoIDHealthCard",
        },
      });
    });
  });
});
