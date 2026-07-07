import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, useRef } from "react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VisitCanadaPost from "../InPerson/VisitCanadaPostPage";
import {
  getAddressRequiredMessage,
  getFirstNameRequiredOrInvalidMessage,
  getIdExpiryRequiredMessage,
  getIdTypeRequiredMessage,
  getLastNameRequiredOrInvalidMessage,
  getProvinceRequiredMessage,
  getSharedDateOfBirthMessages,
  getValidationSummaryHeading,
} from "../InPerson/validation/ErrorsDefinition";
import i18n from "../../../i18n/test";

const mockNavigate = vi.fn();
const mockFlags = vi.hoisted(() => ({ devOnlyFeature: true }));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ language: "en" }),
  };
});

vi.mock("../../../utils/constants", async () => {
  const actual = await vi.importActual("../../../utils/constants");
  return {
    ...actual,
    get DEV_ONLY_FEATURE() {
      return mockFlags.devOnlyFeature;
    },
  };
});

vi.mock("@gcds-core/components-react", () => {
  const GcdsSelect = ({
    children,
    className,
    id,
    onGcdsChange,
    selectId,
    label,
    defaultValue,
    errorMessage,
  }) => {
    const hostRef = useRef(null);

    useEffect(() => {
      if (!hostRef.current || hostRef.current.shadowRoot) {
        return;
      }

      const shadow = hostRef.current.attachShadow({ mode: "open" });
      const wrapper = document.createElement("div");
      wrapper.className = "gcds-select__wrapper";
      const internalSelect = document.createElement("select");
      wrapper.appendChild(internalSelect);
      shadow.appendChild(wrapper);
    }, []);

    return (
      <>
        <gcds-select ref={hostRef} id={id} className={className}>
          {children}
        </gcds-select>
        <select
          aria-label={label}
          data-testid={selectId}
          defaultValue={defaultValue}
          onChange={(e) => onGcdsChange && onGcdsChange(e)}
        >
          {children}
        </select>
        {errorMessage ? <div>{errorMessage}</div> : null}
      </>
    );
  };

  return {
    GcdsFieldset: ({ children, legend }) => (
      <fieldset>
        <legend>{legend}</legend>
        {children}
      </fieldset>
    ),
    GcdsContainer: ({ children }) => <div>{children}</div>,
    GcdsGrid: ({ children }) => <div>{children}</div>,
    GcdsHeading: ({ children, tag }) => {
      const Tag = tag ?? "h2";
      return <Tag>{children}</Tag>;
    },
    GcdsText: ({ children }) => <div>{children}</div>,
    GcdsDetails: ({ children, detailsTitle }) => (
      <details>
        <summary>{detailsTitle}</summary>
        {children}
      </details>
    ),
    GcdsInput: ({ label, onGcdsChange, inputId, errorMessage }) => (
      <>
        <input
          aria-label={label}
          data-testid={inputId}
          onChange={(e) => onGcdsChange && onGcdsChange(e)}
        />
        {errorMessage ? <div>{errorMessage}</div> : null}
      </>
    ),
    GcdsDateInput: React.forwardRef(
      ({ legend, name, onGcdsChange, onBlur, errorMessage }, ref) => (
        <>
          <input
            ref={ref}
            aria-label={legend}
            data-testid={name}
            onChange={(e) => onGcdsChange && onGcdsChange(e)}
            onBlur={(e) => onBlur && onBlur(e)}
          />
          {errorMessage ? <div>{errorMessage}</div> : null}
        </>
      ),
    ),
    GcdsErrorMessage: ({ children }) => <div>{children}</div>,
    GcdsErrorSummary: ({ id, heading, errorLinks }) => (
      <div id={id} data-testid="errorSummary">
        <h2>{heading}</h2>
        {Object.entries(errorLinks ?? {}).map(([href, message], index) => (
          <a key={index} href={href}>
            {message}
          </a>
        ))}
      </div>
    ),
    GcdsSelect,
    GcdsButton: ({ children, buttonRole, onGcdsClick, disabled }) => (
      <button
        data-testid={
          buttonRole === "secondary" ? "back-button" : "continue-button"
        }
        disabled={disabled}
        onClick={(event) => onGcdsClick && onGcdsClick(event)}
      >
        {children}
      </button>
    ),
    GcdsNotice: ({ children, noticeTitle }) => (
      <div data-testid="notice">
        <span>{noticeTitle}</span>
        {children}
      </div>
    ),
    GcdsLink: ({ children, href }) => <a href={href}>{children}</a>,
  };
});

describe("VisitCanadaPost", () => {
  const t = i18n.getFixedT("en", "idv");

  beforeEach(() => {
    vi.clearAllMocks();
    mockFlags.devOnlyFeature = true;
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("renders nothing when DEV_ONLY_FEATURE is false", () => {
    mockFlags.devOnlyFeature = false;

    const { container } = render(<VisitCanadaPost />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders core headings and actions", () => {
    render(<VisitCanadaPost />);

    expect(
      screen.getByRole("heading", {
        name: "Get ready to visit a Canada Post location",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Enter your information" }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("selectId")).toBeInTheDocument();
    expect(
      screen.queryByTestId("id-expiration-date-input"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("first-name-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("last-name-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("date-of-birth-input")).not.toBeInTheDocument();
    expect(screen.getByTestId("continue-button")).toHaveTextContent("Continue");
    expect(screen.getByTestId("back-button")).toHaveTextContent(
      "Choose a different method",
    );
  });

  it("renders the rest of the form once an ID is selected", () => {
    render(<VisitCanadaPost />);

    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "passport" },
    });

    expect(screen.getByTestId("id-expiration-date-input")).toBeInTheDocument();
    expect(screen.getByTestId("first-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("last-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("date-of-birth-input")).toBeInTheDocument();
  });

  it("applies select width styles to the province select when it is rendered later", async () => {
    render(<VisitCanadaPost />);

    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "driverLicence" },
    });

    await waitFor(() => {
      const provinceHost = document.querySelector(
        "gcds-select#select-province",
      );
      const wrapper = provinceHost?.shadowRoot?.querySelector(
        ".gcds-select__wrapper",
      );
      const internalSelect = provinceHost?.shadowRoot?.querySelector("select");

      expect(wrapper).toHaveStyle({ maxWidth: "75ch" });
      expect(internalSelect).toHaveStyle({ width: "100%" });
    });
  });

  it("shows address and province fields only for qualifying IDs", () => {
    render(<VisitCanadaPost />);

    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "passport" },
    });

    expect(screen.queryByTestId("address-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("select-province")).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "driverLicence" },
    });

    expect(screen.getByTestId("address-input")).toBeInTheDocument();
    expect(screen.getByTestId("select-province")).toBeInTheDocument();
  });

  it("renders province option values", () => {
    render(<VisitCanadaPost />);

    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "driverLicence" },
    });

    expect(screen.getAllByText("Ontario").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Quebec").length).toBeGreaterThan(0);
  });

  it("renders the complete acceptable ID list", () => {
    render(<VisitCanadaPost />);

    expect(
      screen.getAllByText("Provincial/Territorial Driver's Licence").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Provincial/Territorial Photo ID Health Card").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Provincial/Territorial Photo ID Service Card")
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Canadian and International Passport").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Canadian PR Card").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Secure Certificate of Indian Status").length,
    ).toBeGreaterThan(0);
  });

  it("navigates back when Different method is clicked", () => {
    render(<VisitCanadaPost />);

    fireEvent.click(screen.getByTestId("back-button"));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("navigates to ProofingBarcodeCanadaPostPage with form data when Continue is clicked", () => {
    render(<VisitCanadaPost />);

    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "driverLicence" },
    });
    fireEvent.change(screen.getByTestId("id-expiration-date-input"), {
      target: { value: "2028-01-01" },
    });
    fireEvent.change(screen.getByTestId("first-name-input"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByTestId("last-name-input"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByTestId("address-input"), {
      target: { value: "123 Main St" },
    });
    fireEvent.change(screen.getByTestId("select-province"), {
      target: { value: "ON" },
    });
    fireEvent.change(screen.getByTestId("date-of-birth-input"), {
      target: { value: "1990-05-15" },
    });

    fireEvent.click(screen.getByTestId("continue-button"));

    const [targetPath, navigationOptions] = mockNavigate.mock.calls[0];
    expect(targetPath).toContain("in-person/canada-post/idv-code");
    expect(mockNavigate).toHaveBeenCalledWith(expect.any(String), {
      state: {
        givenName: "Jane",
        lastName: "Doe",
        dateOfBirth: "1990-05-15",
        address: "123 Main St",
        idSelected: "driverLicence",
      },
    });
    expect(navigationOptions).toBeDefined();
  });

  it("passes dateOfBirth from form state on continue", () => {
    render(<VisitCanadaPost />);

    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "passport" },
    });
    fireEvent.change(screen.getByTestId("id-expiration-date-input"), {
      target: { value: "2028-01-01" },
    });
    fireEvent.change(screen.getByTestId("first-name-input"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByTestId("last-name-input"), {
      target: { value: "Doe" },
    });

    const dateInput = screen.getByTestId("date-of-birth-input");
    fireEvent.change(dateInput, { target: { value: "1990-05-15" } });

    fireEvent.click(screen.getByTestId("continue-button"));

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        state: expect.objectContaining({
          dateOfBirth: "1990-05-15",
        }),
      }),
    );
  });

  it("omits address and province from submit state when the selected ID does not require them", () => {
    render(<VisitCanadaPost />);

    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "driverLicence" },
    });
    fireEvent.change(screen.getByTestId("id-expiration-date-input"), {
      target: { value: "2028-01-01" },
    });
    fireEvent.change(screen.getByTestId("first-name-input"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByTestId("last-name-input"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByTestId("date-of-birth-input"), {
      target: { value: "1990-05-15" },
    });
    fireEvent.change(screen.getByTestId("address-input"), {
      target: { value: "123 Main St" },
    });
    fireEvent.change(screen.getByTestId("select-province"), {
      target: { value: "ON" },
    });

    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "passport" },
    });

    fireEvent.click(screen.getByTestId("continue-button"));

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        state: expect.objectContaining({
          dateOfBirth: "1990-05-15",
          givenName: "Jane",
          idSelected: "passport",
          lastName: "Doe",
        }),
      }),
    );

    expect(mockNavigate.mock.calls[0][1].state).not.toHaveProperty("address");
    expect(mockNavigate.mock.calls[0][1].state).not.toHaveProperty("province");
  });

  it("shows error summary on invalid continue and allows submit once valid", () => {
    render(<VisitCanadaPost />);

    const continueButton = screen.getByTestId("continue-button");
    expect(continueButton).toBeEnabled();

    fireEvent.click(continueButton);

    const summary = screen.getByTestId("errorSummary");
    expect(summary).toHaveTextContent(getValidationSummaryHeading(t));
    expect(summary).toHaveTextContent(getIdTypeRequiredMessage(t));

    expect(
      screen.getAllByText(getIdTypeRequiredMessage(t)).length,
    ).toBeGreaterThan(1);

    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "passport" },
    });
    fireEvent.change(screen.getByTestId("id-expiration-date-input"), {
      target: { value: "2028-01-01" },
    });
    fireEvent.change(screen.getByTestId("first-name-input"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByTestId("last-name-input"), {
      target: { value: "Doe" },
    });

    fireEvent.change(screen.getByTestId("date-of-birth-input"), {
      target: { value: "1990-05-15" },
    });

    fireEvent.click(continueButton);

    expect(mockNavigate).toHaveBeenCalled();
    expect(screen.queryByTestId("errorSummary")).not.toBeInTheDocument();
  });

  it("shows the follow-up required field errors after selecting an ID type", () => {
    render(<VisitCanadaPost />);

    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "driverLicence" },
    });

    fireEvent.click(screen.getByTestId("continue-button"));

    const summary = screen.getByTestId("errorSummary");
    expect(summary).toHaveTextContent(getValidationSummaryHeading(t));
    expect(summary).toHaveTextContent(getIdExpiryRequiredMessage(t));
    expect(summary).toHaveTextContent(getFirstNameRequiredOrInvalidMessage(t));
    expect(summary).toHaveTextContent(getLastNameRequiredOrInvalidMessage(t));
    expect(summary).toHaveTextContent(
      getSharedDateOfBirthMessages(t).required.summary,
    );
    expect(summary).toHaveTextContent(getAddressRequiredMessage(t));
    expect(summary).toHaveTextContent(getProvinceRequiredMessage(t));
  });

  it("blocks navigation and shows invalid date summary for impossible date", () => {
    render(<VisitCanadaPost />);

    const continueButton = screen.getByTestId("continue-button");

    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "passport" },
    });
    fireEvent.change(screen.getByTestId("id-expiration-date-input"), {
      target: { value: "2028-01-01" },
    });
    fireEvent.change(screen.getByTestId("first-name-input"), {
      target: { value: " Jane" },
    });
    fireEvent.change(screen.getByTestId("last-name-input"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByTestId("date-of-birth-input"), {
      target: { value: "2025-02-30" },
    });

    fireEvent.click(continueButton);

    expect(mockNavigate).not.toHaveBeenCalled();
    const summary = screen.getByTestId("errorSummary");
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveTextContent("Date of birth must be a valid date.");
  });

  it("blocks navigation and shows summary when date of birth year is 1900 or earlier", () => {
    render(<VisitCanadaPost />);

    const continueButton = screen.getByTestId("continue-button");

    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "passport" },
    });
    fireEvent.change(screen.getByTestId("id-expiration-date-input"), {
      target: { value: "2028-01-01" },
    });
    fireEvent.change(screen.getByTestId("first-name-input"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByTestId("last-name-input"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByTestId("date-of-birth-input"), {
      target: { value: "1900-01-01" },
    });

    fireEvent.click(continueButton);

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByTestId("errorSummary")).toBeInTheDocument();
  });

  it("shows a date validation error after date of birth blur", () => {
    render(<VisitCanadaPost />);

    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "passport" },
    });
    const dateInput = screen.getByTestId("date-of-birth-input");
    fireEvent.change(dateInput, { target: { value: "1900-01-01" } });
    fireEvent.blur(dateInput);

    expect(
      screen.getByText("Date of birth year must be after 1900."),
    ).toBeInTheDocument();
  });

  it("shows future date errors and keeps user on page", () => {
    render(<VisitCanadaPost />);

    const continueButton = screen.getByTestId("continue-button");

    fireEvent.change(screen.getByTestId("selectId"), {
      target: { value: "passport" },
    });
    fireEvent.change(screen.getByTestId("id-expiration-date-input"), {
      target: { value: "2028-01-01" },
    });
    fireEvent.change(screen.getByTestId("first-name-input"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByTestId("last-name-input"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByTestId("date-of-birth-input"), {
      target: { value: "2999-01-01" },
    });

    fireEvent.click(continueButton);

    expect(mockNavigate).not.toHaveBeenCalled();
    const summary = screen.getByTestId("errorSummary");
    expect(summary).toHaveTextContent("Date of birth cannot be in the future.");
    expect(
      screen.getAllByText("Date of birth cannot be in the future.").length,
    ).toBeGreaterThan(1);
  });

  it("focuses the error summary after invalid submit", async () => {
    render(<VisitCanadaPost />);

    fireEvent.click(screen.getByTestId("continue-button"));

    await waitFor(() => {
      const summary = screen.getByTestId("errorSummary");

      expect(summary.querySelector("a")).toBeTruthy();
      expect(document.activeElement).toBe(summary);
    });
  });
});
