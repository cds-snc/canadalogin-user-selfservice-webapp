import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, useRef } from "react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VisitCanadaPost from "../InPerson/VisitCanadaPostPage";

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
    onGcdsChange,
    selectId,
    label,
    defaultValue,
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
        <gcds-select ref={hostRef} className={className}>
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
      </>
    );
  };

  return {
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
    GcdsInput: ({ label, onGcdsChange, inputId }) => (
      <input
        aria-label={label}
        data-testid={inputId}
        onChange={(e) => onGcdsChange && onGcdsChange(e)}
      />
    ),
    GcdsDateInput: React.forwardRef(({ legend, onGcdsChange, onBlur }, ref) => (
      <input
        ref={ref}
        aria-label={legend}
        data-testid="dateOfBirth"
        onChange={(e) => onGcdsChange && onGcdsChange(e)}
        onBlur={(e) => onBlur && onBlur(e)}
      />
    )),
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
      screen.getByRole("heading", { name: "Enter your information" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("continue-button")).toHaveTextContent("Continue");
    expect(screen.getByTestId("back-button")).toHaveTextContent(
      "Choose a different method",
    );
  });

  it("renders province and country option values", () => {
    render(<VisitCanadaPost />);

    expect(screen.getAllByText("Ontario").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Quebec").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Canada").length).toBeGreaterThan(0);
    expect(screen.getAllByText("United States").length).toBeGreaterThan(0);
  });

  it("renders the complete acceptable ID list", () => {
    render(<VisitCanadaPost />);

    expect(
      screen.getByText("Provincial/Territorial Driver's Licence"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Provincial/Territorial Photo ID Health Card"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Provincial/Territorial Photo ID Service Card"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Canadian and International Passport"),
    ).toBeInTheDocument();
    expect(screen.getByText("Canadian PR Card")).toBeInTheDocument();
    expect(
      screen.getByText("Secure Certificate of Indian Status"),
    ).toBeInTheDocument();
  });

  it("navigates back when Different method is clicked", () => {
    render(<VisitCanadaPost />);

    fireEvent.click(screen.getByTestId("back-button"));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("applies width styling to internal select elements inside shadowRoot", async () => {
    render(<VisitCanadaPost />);

    await waitFor(() => {
      const selects = document.querySelectorAll(
        "gcds-select.visit-canada-post-select",
      );
      expect(selects).toHaveLength(2);

      selects.forEach((selectHost) => {
        const internalSelect = selectHost.shadowRoot?.querySelector("select");
        expect(internalSelect).toBeTruthy();
        expect(internalSelect?.style.width).toBe("100%");
      });
    });
  });

  it("navigates to ProofingBarcodeCanadaPostPage with form data when Continue is clicked", () => {
    render(<VisitCanadaPost />);

    fireEvent.change(screen.getByTestId("givenName"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByTestId("familyName"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByTestId("address"), {
      target: { value: "123 Main St" },
    });
    fireEvent.change(screen.getByTestId("province"), {
      target: { value: "ON" },
    });
    fireEvent.change(screen.getByTestId("country"), {
      target: { value: "CA" },
    });
    fireEvent.change(screen.getByTestId("dateOfBirth"), {
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
        province: "ON",
        country: "CA",
      },
    });
    expect(navigationOptions).toBeDefined();
  });

  it("passes dateOfBirth from form state on continue", () => {
    render(<VisitCanadaPost />);

    fireEvent.change(screen.getByTestId("givenName"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByTestId("familyName"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByTestId("address"), {
      target: { value: "123 Main St" },
    });
    fireEvent.change(screen.getByTestId("province"), {
      target: { value: "ON" },
    });
    fireEvent.change(screen.getByTestId("country"), {
      target: { value: "CA" },
    });

    const dateInput = screen.getByTestId("dateOfBirth");
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

  it("shows error summary on invalid continue and allows submit once valid", () => {
    render(<VisitCanadaPost />);

    const continueButton = screen.getByTestId("continue-button");
    expect(continueButton).toBeEnabled();

    fireEvent.click(continueButton);

    const summary = screen.getByTestId("errorSummary");
    expect(summary).toHaveTextContent("Given name is required or invalid.");
    expect(summary).toHaveTextContent("Family name is required or invalid.");
    expect(summary).toHaveTextContent("Date of birth is required.");
    expect(summary).toHaveTextContent("Address is required.");
    expect(summary).toHaveTextContent("Province / State is required.");
    expect(summary).toHaveTextContent("Country is required.");

    expect(
      screen.getAllByText("Given name is required or invalid.").length,
    ).toBeGreaterThan(1);
    expect(
      screen.getAllByText("Family name is required or invalid.").length,
    ).toBeGreaterThan(1);
    expect(screen.getAllByText("Address is required.").length).toBeGreaterThan(
      1,
    );
    expect(
      screen.getAllByText("Province / State is required.").length,
    ).toBeGreaterThan(1);
    expect(screen.getAllByText("Country is required.").length).toBeGreaterThan(
      1,
    );

    fireEvent.change(screen.getByTestId("givenName"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByTestId("familyName"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByTestId("address"), {
      target: { value: "123 Main St" },
    });
    fireEvent.change(screen.getByTestId("province"), {
      target: { value: "ON" },
    });
    fireEvent.change(screen.getByTestId("country"), {
      target: { value: "CA" },
    });

    fireEvent.change(screen.getByTestId("dateOfBirth"), {
      target: { value: "1990-05-15" },
    });

    fireEvent.click(continueButton);

    expect(mockNavigate).toHaveBeenCalled();
    expect(screen.queryByTestId("errorSummary")).not.toBeInTheDocument();
  });

  it("blocks navigation and shows invalid date summary for impossible date", () => {
    render(<VisitCanadaPost />);

    const continueButton = screen.getByTestId("continue-button");

    fireEvent.change(screen.getByTestId("givenName"), {
      target: { value: " Jane" },
    });
    fireEvent.change(screen.getByTestId("familyName"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByTestId("address"), {
      target: { value: "123 Main St" },
    });
    fireEvent.change(screen.getByTestId("province"), {
      target: { value: "ON" },
    });
    fireEvent.change(screen.getByTestId("country"), {
      target: { value: "CA" },
    });
    fireEvent.change(screen.getByTestId("dateOfBirth"), {
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

    fireEvent.change(screen.getByTestId("givenName"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByTestId("familyName"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByTestId("address"), {
      target: { value: "123 Main St" },
    });
    fireEvent.change(screen.getByTestId("province"), {
      target: { value: "ON" },
    });
    fireEvent.change(screen.getByTestId("country"), {
      target: { value: "CA" },
    });
    fireEvent.change(screen.getByTestId("dateOfBirth"), {
      target: { value: "1900-01-01" },
    });

    fireEvent.click(continueButton);

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByTestId("errorSummary")).toBeInTheDocument();
  });

  it("shows a date validation error after date of birth blur", () => {
    render(<VisitCanadaPost />);

    const dateInput = screen.getByTestId("dateOfBirth");
    fireEvent.change(dateInput, { target: { value: "1900-01-01" } });
    fireEvent.blur(dateInput);

    expect(
      screen.getByText("Date of birth year must be after 1900."),
    ).toBeInTheDocument();
  });

  it("shows future date errors and keeps user on page", () => {
    render(<VisitCanadaPost />);

    const continueButton = screen.getByTestId("continue-button");

    fireEvent.change(screen.getByTestId("givenName"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByTestId("familyName"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByTestId("address"), {
      target: { value: "123 Main St" },
    });
    fireEvent.change(screen.getByTestId("province"), {
      target: { value: "ON" },
    });
    fireEvent.change(screen.getByTestId("country"), {
      target: { value: "CA" },
    });
    fireEvent.change(screen.getByTestId("dateOfBirth"), {
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

  it("focuses the first summary link after invalid submit", async () => {
    render(<VisitCanadaPost />);

    fireEvent.click(screen.getByTestId("continue-button"));

    await waitFor(() => {
      const summary = screen.getByTestId("errorSummary");
      const firstLink = summary.querySelector("a");

      expect(firstLink).toBeTruthy();
      expect(document.activeElement).toBe(firstLink);
    });
  });
});
