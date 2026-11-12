import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DataTransparencyPage from "../DataTransparencyPage";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  relyingParty: {
    hasRelyingParty: true,
    relyingPartyName: "Example service",
    relyingPartyUrl: "https://rp.example/callback",
  },
}));

vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ state: undefined }),
  useParams: () => ({ language: "en" }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

vi.mock("../../../hooks/useRelyingPartyInfo", () => ({
  useRelyingPartyInfo: () => mocks.relyingParty,
}));

vi.mock("../../../utils/constants", async (importOriginal) => ({
  ...(await importOriginal()),
  DEV_ONLY_FEATURE: false,
}));

vi.mock("../components/DataInformationCard", () => ({
  default: () => null,
}));

vi.mock("../../../components/InfoBlocks/AccessibleNotice", () => ({
  default: () => null,
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }) => <div>{children}</div>,
  GcdsGrid: ({ children }) => <div>{children}</div>,
  GcdsHeading: ({ children }) => <h1>{children}</h1>,
  GcdsText: ({ children }) => <p>{children}</p>,
  GcdsLink: ({ children }) => <a>{children}</a>,
  GcdsButton: ({ children, onGcdsClick }) => (
    <button onClick={onGcdsClick}>{children}</button>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.relyingParty.hasRelyingParty = true;
  mocks.relyingParty.relyingPartyUrl = "https://rp.example/callback";
  vi.stubGlobal("location", {
    href: "https://login.example/en/data-transparency",
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("DataTransparencyPage RP redirect", () => {
  it.each([
    [
      "https://rp.example/callback",
      "https://rp.example/callback?verified=true",
    ],
    [
      "https://rp.example/callback?state=abc#details",
      "https://rp.example/callback?state=abc&verified=true#details",
    ],
    [
      "https://rp.example/callback?verified=false",
      "https://rp.example/callback?verified=true",
    ],
    ["/callback", "https://login.example/callback?verified=true"],
    ["", "https://login.example/?verified=true"],
  ])("adds verified=true to %s", (url, expected) => {
    mocks.relyingParty.relyingPartyUrl = url;
    render(<DataTransparencyPage />);

    fireEvent.click(screen.getByRole("button"));

    expect(window.location.href).toBe(expected);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("returns to the profile without an RP", () => {
    mocks.relyingParty.hasRelyingParty = false;
    render(<DataTransparencyPage />);

    fireEvent.click(screen.getByRole("button"));

    expect(mocks.navigate).toHaveBeenCalledWith("/en/profile");
    expect(window.location.href).toBe(
      "https://login.example/en/data-transparency",
    );
  });
});
