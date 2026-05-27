import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router";
import DeleteMFAPhoneNumberConfirm from "../DeleteMFAPhoneNumberConfirm";
import "@testing-library/jest-dom/vitest";
import "../../../../../i18n/test";

vi.mock("@gcds-core/components-react", () => ({
  GcdsButton: ({ children, onGcdsClick, buttonRole, style }) => (
    <button data-button-role={buttonRole} onClick={onGcdsClick} style={style}>
      {children}
    </button>
  ),
  GcdsContainer: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsGrid: ({ children }) => <div>{children}</div>,
  GcdsHeading: ({ children, tag = "h1", lang }) => {
    const Component = tag;
    return <Component lang={lang}>{children}</Component>;
  },
  GcdsLink: ({ children, href }) => <a href={href}>{children}</a>,
  GcdsText: ({ children }) => <div>{children}</div>,
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: vi.fn(() => ({ language: "en" })),
  };
});

vi.mock("../../../../../utils/routeHelpers", () => ({
  path: vi.fn(() => "/en/profile"),
}));

describe("DeleteMFAPhoneNumberConfirm", () => {
  it("renders the Figma-aligned heading and primary actions", () => {
    render(
      <BrowserRouter>
        <DeleteMFAPhoneNumberConfirm
          onNext={vi.fn()}
          onCancel={vi.fn()}
          phoneFormData={{ formattedPhoneNumber: "+1 (***) ***-4853" }}
        />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole("heading", {
        name: "Are you sure you want to delete this phone number?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("delete-phone-confirm-accent"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yes, delete" })).toHaveAttribute(
      "data-button-role",
      "danger",
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveAttribute(
      "data-button-role",
      "secondary",
    );
  });
});
