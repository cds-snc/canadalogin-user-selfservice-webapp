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
  const GcdsSelect = ({ children, className }) => {
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
      <gcds-select ref={hostRef} className={className}>
        {children}
      </gcds-select>
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
    GcdsDateInput: React.forwardRef(({ legend }, ref) => (
      <input ref={ref} aria-label={legend} data-testid="dateOfBirth" />
    )),
    GcdsSelect,
    GcdsButton: ({ children, buttonRole, onGcdsClick }) => (
      <button
        data-testid={
          buttonRole === "secondary" ? "back-button" : "continue-button"
        }
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

    expect(screen.getByText("Ontario")).toBeInTheDocument();
    expect(screen.getByText("Quebec")).toBeInTheDocument();
    expect(screen.getByText("Canada")).toBeInTheDocument();
    expect(screen.getByText("United States")).toBeInTheDocument();
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

    fireEvent.click(screen.getByTestId("continue-button"));

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        state: expect.objectContaining({
          givenName: "Jane",
          lastName: "Doe",
          address: "123 Main St",
        }),
      }),
    );
  });

  it("reads dateOfBirth from the date input ref on continue", () => {
    render(<VisitCanadaPost />);

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
});
