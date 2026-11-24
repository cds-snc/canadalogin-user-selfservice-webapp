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
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        "DataTransparencyPage.title":
          "Information being shared with {{relyingPartyName}}",
        "DataTransparencyPage.descriptionPrefix":
          "By continuing, CanadaLogin will share the following details with ",
        "DataTransparencyPage.descriptionSuffix": ":",
        "DataTransparencyPage.informationSharingTitle":
          "How CanadaLogin shares your information",
        "DataTransparencyPage.informationSharingDescription":
          "Services request your details from CanadaLogin to know who you are and to provide a personalized experience.",
        "DataTransparencyPage.learnMoreLink":
          "Learn how your information is shared and stored with services",
        "DataTransparencyPage.continueButton": "Continue",
        "DataInformationCard.contactDetailsHeading": "Contact details",
        "DataInformationCard.preferredName": "Name",
        "DataInformationCard.emailAddress": "Email address",
        "DataInformationCard.languagePreference": "Language preference",
        "DataInformationCard.phoneNumber": "Phone number",
        "DataInformationCard.identityDetailsHeading": "Identity details",
        "DataInformationCard.legalName": "Legal name",
        "DataInformationCard.dateOfBirth": "Date of birth",
        "DataInformationCard.wrongInformation": "If your information is wrong",
        "DataInformationCard.wrongInformationDescription":
          "If your details have changed, you can still continue to the service and go to update your information in your CanadaLogin settings. You will need to re-sign into the service again to share your newly saved details.",
        "DataInformationCard.neverSharedHeading":
          "Never shared with any service",
        "DataInformationCard.neverSharedDescription":
          "This information stays private in CanadaLogin:",
        "DataInformationCard.passwordDetails":
          "your password or passkey details",
        "DataInformationCard.otherServicesInfo":
          "your information from others services",
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock("../../../hooks/useRelyingPartyInfo", () => ({
  useRelyingPartyInfo: () => mocks.relyingParty,
}));

vi.mock("../../../utils/constants", async (importOriginal) => ({
  ...(await importOriginal()),
  DEV_ONLY_FEATURE: false,
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
  GcdsDetails: ({ children, detailsTitle }) => (
    <details>
      <summary>{detailsTitle}</summary>
      {children}
    </details>
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
    ["https://rp.example", "https://rp.example/terms"],
    ["https://rp.example/", "https://rp.example/terms"],
    ["https://rp.example/callback", "https://rp.example/terms"],
    [
      "https://rp.example/callback?state=abc#details",
      "https://rp.example/terms",
    ],
    ["https://rp.example/callback?verified=false", "https://rp.example/terms"],
    ["/callback", "https://login.example/terms"],
  ])("redirects %s to the RP terms page", (url, expected) => {
    mocks.relyingParty.relyingPartyUrl = url;
    render(<DataTransparencyPage />);

    fireEvent.click(screen.getByRole("button"));

    expect(window.location.href).toBe(expected);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it.each([
    [false, "https://rp.example/callback"],
    [true, ""],
    [true, undefined],
  ])(
    "returns to the profile with hasRelyingParty=%s and URL=%s",
    (hasRP, url) => {
      mocks.relyingParty.hasRelyingParty = hasRP;
      mocks.relyingParty.relyingPartyUrl = url;
      render(<DataTransparencyPage />);

      fireEvent.click(screen.getByRole("button"));

      expect(mocks.navigate).toHaveBeenCalledWith("/en/profile");
      expect(window.location.href).toBe(
        "https://login.example/en/data-transparency",
      );
    },
  );
});

describe("DataInformationCard rendering", () => {
  it("renders data information card with contact details", () => {
    render(<DataTransparencyPage />);

    expect(
      screen.getByText((text) => text.includes("Contact details")),
    ).toBeInTheDocument();
  });

  it("renders data information card with identity details", () => {
    render(<DataTransparencyPage />);

    expect(
      screen.getByText((text) => text.includes("Identity details")),
    ).toBeInTheDocument();
  });

  it("renders data information card with never shared section", () => {
    render(<DataTransparencyPage />);

    expect(
      screen.getByText((text) =>
        text.includes("Never shared with any service"),
      ),
    ).toBeInTheDocument();
  });

  it("renders all contact detail fields", () => {
    render(<DataTransparencyPage />);

    const container = screen.getByText((text) =>
      text.includes("Contact details"),
    );
    expect(container).toBeInTheDocument();

    expect(screen.getByText("canadalogintester@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("613 284 3847")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("renders all identity detail fields", () => {
    render(<DataTransparencyPage />);

    expect(
      screen.getByText((text) => text.includes("Legal name")),
    ).toBeInTheDocument();
    expect(
      screen.getByText((text) => text.includes("Date of birth")),
    ).toBeInTheDocument();
  });

  it("renders default mock data with Alex Morgan", () => {
    render(<DataTransparencyPage />);

    const alexMorganElements = screen.getAllByText(
      (text) => text === "Alex Morgan",
    );
    expect(alexMorganElements.length).toBeGreaterThan(0);
  });

  it("renders email address canadalogintester@gmail.com", () => {
    render(<DataTransparencyPage />);

    expect(
      screen.getByText((text) => text.includes("canadalogintester@gmail.com")),
    ).toBeInTheDocument();
  });

  it("renders dropdown for wrong information", () => {
    render(<DataTransparencyPage />);

    expect(
      screen.getByText((text) => text.includes("If your information is wrong")),
    ).toBeInTheDocument();
  });

  it("renders never shared description", () => {
    render(<DataTransparencyPage />);

    expect(
      screen.getByText((text) =>
        text.includes("This information stays private in CanadaLogin:"),
      ),
    ).toBeInTheDocument();
  });
});
