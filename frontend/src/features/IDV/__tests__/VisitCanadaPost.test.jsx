import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VisitCanadaPost from "../InPerson/VisitCanadaPost";

const mockNavigate = vi.fn();
let mockDevOnlyFeature = true;

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../utils/constants", async () => {
  const actual = await vi.importActual("../../../utils/constants");
  return {
    ...actual,
    get DEV_ONLY_FEATURE() {
      return mockDevOnlyFeature;
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
    GcdsInput: ({ label }) => <div>{label}</div>,
    GcdsDateInput: ({ legend }) => <div>{legend}</div>,
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
    mockDevOnlyFeature = true;
  });

  it("renders nothing when DEV_ONLY_FEATURE is false", () => {
    mockDevOnlyFeature = false;

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
});
