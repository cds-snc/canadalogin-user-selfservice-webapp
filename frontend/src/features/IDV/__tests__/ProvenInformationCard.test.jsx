import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProvenInformationCard from "../ProvenInformationCard";
import i18n from "../../../i18n/test";

const mockNavigate = vi.fn();
const mockFlags = vi.hoisted(() => ({
  idvFeatureAccess: true,
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../hooks/useIdvFeatureAccess", () => ({
  useIdvFeatureAccess: () => mockFlags.idvFeatureAccess,
}));

vi.mock("../../../components/Providers/useUser", () => ({
  useUser: () => ({
    state: {
      userProfile: {
        userName: "test@example.com",
        name: {
          givenName: "Jane",
          familyName: "Doe",
          formatted: "Jane Doe",
        },
      },
    },
    dispatch: vi.fn(),
  }),
}));

vi.mock("../../../utils/constants", async () => {
  const actual = await vi.importActual("../../../utils/constants");
  return {
    ...actual,
    PAGES: {
      ...actual.PAGES,
      idvServiceCanadaCentrePage: "idvServiceCanadaCentrePage",
      idvOnlineVerificationInfoPage: "idvOnlineVerificationInfoPage",
      idvProvincialVerificationPage: "idvProvincialVerificationPage",
    },
  };
});

vi.mock("@gcds-core/components-react", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    GcdsContainer: ({ children, ...props }) => <div {...props}>{children}</div>,
    GcdsGrid: ({ children }) => <div>{children}</div>,
    GcdsHeading: ({ children, tag }) => {
      const Tag = tag ?? "h2";
      return <Tag>{children}</Tag>;
    },
    GcdsText: ({ children }) => <p>{children}</p>,
  };
});

describe("ProvenInformationCard", () => {
  const claims = {
    verification: { time: "2026-01-27T12:00:00Z" },
    claims: {
      given_name: "Jane",
      family_name: "Doe",
      birthdate: "1990-02-01",
    },
  };

  const sourceDisplay = {
    documents: [
      {
        display_name: {
          en: "Driver's Licence (Ontario)",
          fr: "Permis de conduire (Ontario)",
        },
      },
    ],
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockFlags.idvFeatureAccess = true;
    await i18n.changeLanguage("en");
  });

  it("renders nothing when IDV access is disabled", () => {
    mockFlags.idvFeatureAccess = false;
    const { container } = render(<ProvenInformationCard claims={claims} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the Name section heading", () => {
    render(
      <ProvenInformationCard claims={claims} sourceDisplay={sourceDisplay} />,
    );
    expect(
      screen.getByRole("heading", { name: "Legal name" }),
    ).toBeInTheDocument();
  });

  it("renders the formatted name from user context", () => {
    render(
      <ProvenInformationCard claims={claims} sourceDisplay={sourceDisplay} />,
    );
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders the Date of birth section heading", () => {
    render(
      <ProvenInformationCard claims={claims} sourceDisplay={sourceDisplay} />,
    );
    expect(
      screen.getByRole("heading", { name: "Date of birth" }),
    ).toBeInTheDocument();
    expect(screen.getByText("February 1, 1990")).toBeInTheDocument();
  });

  it("renders the date of birth with the French ordinal for the first day", async () => {
    await i18n.changeLanguage("fr");

    render(
      <ProvenInformationCard claims={claims} sourceDisplay={sourceDisplay} />,
    );

    const dobSection = screen.getByRole("heading", {
      name: "Date de naissance",
    }).parentElement;

    expect(dobSection).toHaveTextContent("1er février 1990");
    expect(within(dobSection).getByText("er").tagName).toBe("SUP");
  });

  it("renders the Source of information section heading", () => {
    render(
      <ProvenInformationCard claims={claims} sourceDisplay={sourceDisplay} />,
    );
    expect(
      screen.getByRole("heading", { name: "Source of information" }),
    ).toBeInTheDocument();
  });

  it("renders the source of information display name in English", () => {
    render(
      <ProvenInformationCard claims={claims} sourceDisplay={sourceDisplay} />,
    );
    expect(screen.getByText("Driver's Licence (Ontario)")).toBeInTheDocument();
  });

  it("renders the source of information display name in French", async () => {
    await i18n.changeLanguage("fr");

    render(
      <ProvenInformationCard claims={claims} sourceDisplay={sourceDisplay} />,
    );
    expect(
      screen.getByText("Permis de conduire (Ontario)"),
    ).toBeInTheDocument();
  });

  it("does not render Source of information section when sourceDisplay is not provided", () => {
    const claimsWithoutSource = {
      verification: { time: "2026-01-27T12:00:00Z" },
      claims: {
        given_name: "Jane",
        family_name: "Doe",
        birthdate: "1990-02-01",
      },
    };

    render(<ProvenInformationCard claims={claimsWithoutSource} />);

    const headings = screen.getAllByRole("heading");
    const sourceHeadings = headings.filter(
      (heading) => heading.textContent === "Source of information",
    );
    expect(sourceHeadings).toHaveLength(0);
  });

  it("renders the update info description text", () => {
    render(
      <ProvenInformationCard claims={claims} sourceDisplay={sourceDisplay} />,
    );
    expect(
      screen.getByText(
        "To update this information, you'll need to complete identity proofing again.",
      ),
    ).toBeInTheDocument();
  });

  it("renders an empty name when claims have no name", () => {
    const { container } = render(
      <ProvenInformationCard claims={{ claims: {} }} />,
    );

    expect(
      screen.getByRole("heading", { name: "Legal name" }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll(".separator").length).toBeGreaterThan(0);
  });
});
