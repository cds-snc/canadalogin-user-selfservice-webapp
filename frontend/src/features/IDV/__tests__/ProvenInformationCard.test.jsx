import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProvenInformationCard from "../ProvenInformationCard";
import i18n from "../../../i18n/test";

const mockNavigate = vi.fn();
const mockFlags = vi.hoisted(() => ({
  devOnlyFeature: true,
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
    useNavigate: () => mockNavigate,
  };
});

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
    get DEV_ONLY_FEATURE() {
      return mockFlags.devOnlyFeature;
    },
    PAGES: {
      ...actual.PAGES,
      idvServiceCanadaCentrePage: "idvServiceCanadaCentrePage",
      idvOnlineVerificationInfoPage: "idvOnlineVerificationInfoPage",
      idvProvincialVerificationPage: "idvProvincialVerificationPage",
    },
  };
});

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsGrid: ({ children }) => <div>{children}</div>,
  GcdsHeading: ({ children, tag }) => {
    const Tag = tag ?? "h2";
    return <Tag>{children}</Tag>;
  },
  GcdsText: ({ children }) => <p>{children}</p>,
  GcdsButton: ({ children, onGcdsClick, buttonRole }) => (
    <button
      data-testid={buttonRole === "secondary" ? "update-button" : "button"}
      onClick={onGcdsClick}
    >
      {children}
    </button>
  ),
}));

describe("ProvenInformationCard", () => {
  const claims = {
    verification: { time: "2026-01-27T12:00:00Z" },
    claims: {
      given_name: "Jane",
      family_name: "Doe",
      birthdate: "1990-02-01",
      id_document: "Passport: Expires June 25, 2030",
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockFlags.devOnlyFeature = true;
    await i18n.changeLanguage("en");
  });

  it("renders null when DEV_ONLY_FEATURE is false", () => {
    mockFlags.devOnlyFeature = false;
    const { container } = render(<ProvenInformationCard claims={claims} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the Name section heading", () => {
    render(<ProvenInformationCard claims={claims} />);
    expect(screen.getByRole("heading", { name: "Name" })).toBeInTheDocument();
  });

  it("renders the formatted name from user context", () => {
    render(<ProvenInformationCard claims={claims} />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders the Date of birth section heading", () => {
    render(<ProvenInformationCard claims={claims} />);
    expect(
      screen.getByRole("heading", { name: "Date of birth" }),
    ).toBeInTheDocument();
    expect(screen.getByText("February 1, 1990")).toBeInTheDocument();
  });

  it("renders the date of birth in the selected French language", async () => {
    await i18n.changeLanguage("fr");

    render(<ProvenInformationCard claims={claims} />);

    expect(screen.getByText("1 février 1990")).toBeInTheDocument();
  });

  it("renders the ID document section heading", () => {
    render(<ProvenInformationCard claims={claims} />);
    expect(
      screen.getByRole("heading", { name: "ID document saved to CanadaLogin" }),
    ).toBeInTheDocument();
  });

  it("renders the update info description text", () => {
    render(<ProvenInformationCard claims={claims} />);
    expect(
      screen.getByText(
        "To update this information, you'll need to complete identity proofing again.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the Update information button", () => {
    render(<ProvenInformationCard claims={claims} />);
    expect(screen.getByTestId("update-button")).toHaveTextContent(
      "Update information",
    );
  });

  it("renders an empty name when claims have no name", () => {
    const { container } = render(
      <ProvenInformationCard claims={{ claims: {} }} />,
    );

    expect(screen.getByRole("heading", { name: "Name" })).toBeInTheDocument();
    expect(container.querySelectorAll(".separator")).toHaveLength(1);
  });
});
