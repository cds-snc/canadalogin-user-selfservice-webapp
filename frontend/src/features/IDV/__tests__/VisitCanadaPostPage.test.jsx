import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VisitCanadaPost from "../InPerson/VisitCanadaPostPage";
import { getIdTypeRequiredMessage } from "../InPerson/validation/ErrorsDefinition";
import i18n from "../../../i18n/test";

const mockNavigate = vi.fn();
const mockFlags = vi.hoisted(() => ({ devOnlyFeature: true }));
const mockGetIdentityDocuments = vi.hoisted(() => vi.fn());

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ language: "en", journeyType: "start" }),
  };
});

vi.mock("../../../hooks/useRelyingPartyInfo", () => ({
  useRelyingPartyInfo: () => ({ relyingPartyName: "RP Name" }),
}));

vi.mock("../../../utils/constants", async () => {
  const actual = await vi.importActual("../../../utils/constants");
  return {
    ...actual,
    get DEV_ONLY_FEATURE() {
      return mockFlags.devOnlyFeature;
    },
  };
});

vi.mock("../api/identityDocumentsApi", () => ({
  identityDocumentsApi: { getIdentityDocuments: mockGetIdentityDocuments },
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }) => <div>{children}</div>,
  GcdsGrid: ({ children }) => <div>{children}</div>,
  GcdsHeading: ({ children, tag }) => {
    const Tag = tag ?? "h2";
    return <Tag>{children}</Tag>;
  },
  GcdsText: ({ children }) => <div>{children}</div>,
  GcdsLink: ({ children, href }) => <a href={href}>{children}</a>,
  GcdsNotice: ({ children, noticeTitle }) => (
    <div data-testid="notice">
      <span>{noticeTitle}</span>
      {children}
    </div>
  ),
  GcdsErrorSummary: ({ id, errorLinks }) => (
    <div id={id} data-testid="errorSummary">
      {Object.entries(errorLinks ?? {}).map(([href, message]) => (
        <a key={href} href={href}>
          {message}
        </a>
      ))}
    </div>
  ),
  GcdsRadios: ({ id, legend, options, errorMessage, onGcdsChange }) => (
    <fieldset id={id}>
      <legend>{legend}</legend>
      {options.map((option) => (
        <div key={option.id}>
          <label>
            <input
              type="radio"
              name={id}
              value={option.value}
              onChange={(event) => onGcdsChange?.(event)}
            />
            {option.label}
          </label>
          {option.hint ? <span>{option.hint}</span> : null}
        </div>
      ))}
      {errorMessage ? (
        <div data-testid="radios-error">{errorMessage}</div>
      ) : null}
    </fieldset>
  ),
  GcdsButton: ({ children, buttonRole, onGcdsClick }) => (
    <button
      data-testid={
        buttonRole === "secondary" ? "back-button" : "continue-button"
      }
      onClick={(event) => onGcdsClick?.(event)}
    >
      {children}
    </button>
  ),
}));

const PASSPORT = {
  key: "PASSPORT",
  name_en: "Passport",
  name_fr: "Passeport",
  options: [
    {
      id: 1,
      name_en: "Canada",
      name_fr: "Canada",
      option_type: "country",
      canada_post_id: "C014",
      country_code: "CA",
      province_code: null,
      requires_proof: true,
    },
  ],
};

describe("VisitCanadaPost (Select your ID)", () => {
  const t = i18n.getFixedT("en", "idv");

  beforeEach(() => {
    vi.clearAllMocks();
    mockFlags.devOnlyFeature = true;
    mockGetIdentityDocuments.mockResolvedValue([PASSPORT]);
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

  it("renders the static ID radios without calling the API", () => {
    render(<VisitCanadaPost />);

    expect(screen.getAllByRole("radio").map((radio) => radio.value)).toEqual([
      "PASSPORT",
      "DRIVERS_LICENCE",
      "PROVINCIAL_PHOTO_ID",
      "PROVINCIAL_HEALTH_CARD",
      "PERMANENT_RESIDENT_CARD",
      "INDIAN_STATUS_CARD",
      "COMBO_CARD",
      "noIds",
    ]);
    expect(screen.getByLabelText("Passport")).toBeInTheDocument();
    expect(
      screen.getByText("Canadian and international accepted"),
    ).toBeInTheDocument();
    expect(screen.getByText("Only valid for Quebec")).toBeInTheDocument();
    expect(
      screen.getByText("Only valid for BC and Alberta"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("I don't have any of those IDs"),
    ).toBeInTheDocument();
    expect(mockGetIdentityDocuments).not.toHaveBeenCalled();
  });

  it("requires an ID selection before continuing", () => {
    render(<VisitCanadaPost />);

    fireEvent.click(screen.getByTestId("continue-button"));

    expect(screen.getByTestId("errorSummary")).toHaveTextContent(
      getIdTypeRequiredMessage(t),
    );
    expect(screen.getByTestId("radios-error")).toBeInTheDocument();
    expect(mockGetIdentityDocuments).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("navigates back to the method selection when the user has none of the IDs", () => {
    render(<VisitCanadaPost />);

    fireEvent.click(screen.getByLabelText("I don't have any of those IDs"));
    fireEvent.click(screen.getByTestId("continue-button"));

    expect(mockGetIdentityDocuments).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/identity-verification/start/in-person",
    );
  });

  it("fetches the selected document type on submit, shows a loader, then navigates with it", async () => {
    let resolveRequest;
    mockGetIdentityDocuments.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    render(<VisitCanadaPost />);

    fireEvent.click(screen.getByLabelText("Passport"));
    fireEvent.click(screen.getByTestId("continue-button"));

    expect(mockGetIdentityDocuments).toHaveBeenCalledWith(["PASSPORT"]);
    expect(
      await screen.findByRole("heading", {
        name: t("CanadaPostSelectId.loading"),
      }),
    ).toBeInTheDocument();

    resolveRequest([PASSPORT]);

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        "/en/identity-verification/start/in-person/canada-post/proof-of-address",
        { state: { document: PASSPORT } },
      ),
    );
  });

  it.each([
    "PASSPORT",
    "PERMANENT_RESIDENT_CARD",
    "INDIAN_STATUS_CARD",
    "PROVINCIAL_HEALTH_CARD",
  ])(
    "shows proof of address for a single %s option requiring proof",
    async (key) => {
      const document = { ...PASSPORT, key };
      mockGetIdentityDocuments.mockResolvedValue([document]);
      render(<VisitCanadaPost />);

      fireEvent.click(screen.getByDisplayValue(key));
      fireEvent.click(screen.getByTestId("continue-button"));

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith(
          "/en/identity-verification/start/in-person/canada-post/proof-of-address",
          { state: { document } },
        ),
      );
    },
  );

  it.each([
    ["all options require proof", [true, true], "proof-of-address"],
    ["only the foreign option requires proof", [false, true], "id-details"],
    ["no options require proof", [false, false], "id-details"],
    ["a single option does not require proof", [false], "id-details"],
  ])("routes according to the API when %s", async (_, flags, nextPage) => {
    const document = {
      ...PASSPORT,
      options: flags.map((requires_proof, index) => ({
        ...PASSPORT.options[0],
        id: index + 1,
        requires_proof,
      })),
    };
    mockGetIdentityDocuments.mockResolvedValue([document]);
    render(<VisitCanadaPost />);

    fireEvent.click(screen.getByLabelText("Passport"));
    fireEvent.click(screen.getByTestId("continue-button"));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        `/en/identity-verification/start/in-person/canada-post/${nextPage}`,
        { state: { document } },
      ),
    );
  });

  it.each([
    [
      "the request fails",
      () => mockGetIdentityDocuments.mockRejectedValue(new Error("boom")),
    ],
    [
      "the document is not returned",
      () => mockGetIdentityDocuments.mockResolvedValue([]),
    ],
    [
      "the document has no options",
      () =>
        mockGetIdentityDocuments.mockResolvedValue([
          { ...PASSPORT, options: [] },
        ]),
    ],
  ])("shows an error notice and keeps the form when %s", async (_, arrange) => {
    arrange();
    render(<VisitCanadaPost />);

    fireEvent.click(screen.getByLabelText("Passport"));
    fireEvent.click(screen.getByTestId("continue-button"));

    expect(
      await screen.findByText(t("CanadaPostSelectId.loadErrorTitle")),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(8);
    expect(screen.getByTestId("continue-button")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("goes back when choosing a different method", () => {
    render(<VisitCanadaPost />);

    fireEvent.click(screen.getByTestId("back-button"));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
