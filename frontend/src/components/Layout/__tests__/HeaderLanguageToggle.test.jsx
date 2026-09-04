import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Header from "../Header";

const mockNavigate = vi.hoisted(() => vi.fn());
const routeState = vi.hoisted(() => ({
  idvCode: "ABC123XYZ",
  firstName: "Jane",
}));

vi.mock("react-router", () => ({
  useLocation: () => ({ state: routeState }),
  useNavigate: () => mockNavigate,
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }) => <div>{children}</div>,
  GcdsHeader: ({ children }) => <header>{children}</header>,
  GcdsLangToggle: ({ onGcdsClick }) => (
    <button
      onClick={() =>
        onGcdsClick({
          detail: "/fr/idv/in-person/service-canada-centre/code",
          preventDefault: vi.fn(),
        })
      }
    >
      Change language
    </button>
  ),
}));

vi.mock("../TopNav", () => ({ default: () => null }));
vi.mock("../Breadcrumbs", () => ({ default: () => null }));

describe("Header language toggle", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("preserves route state when navigating to the alternate language", () => {
    render(<Header langHref="/fr/idv" currentLang="en" />);

    fireEvent.click(screen.getByRole("button", { name: "Change language" }));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/fr/idv/in-person/service-canada-centre/code",
      { state: routeState },
    );
  });
});
