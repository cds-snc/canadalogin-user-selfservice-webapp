import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CanadaPostIdDetailsPage from "../InPerson/CanadaPostIdDetailsPage";
import {
  getIdExpiryRequiredMessage,
  getIdExpiryTooSoonMessage,
  getPostalCodeRequiredOrInvalidMessage,
} from "../InPerson/validation/ErrorsDefinition";
import i18n from "../../../i18n/test";

const mockNavigate = vi.fn();
const mockFlags = vi.hoisted(() => ({ devOnlyFeature: true }));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return { ...actual, useNavigate: () => mockNavigate };
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

vi.mock("../helpers/useGcdsSelectWidth", () => ({ default: vi.fn() }));

vi.mock("@gcds-core/components-react", () => {
  const withError = (element, errorMessage) => (
    <>
      {element}
      {errorMessage ? <div>{errorMessage}</div> : null}
    </>
  );

  return {
    GcdsContainer: ({ children }) => <div>{children}</div>,
    GcdsGrid: ({ children }) => <div>{children}</div>,
    GcdsHeading: ({ children, tag }) => {
      const Tag = tag ?? "h2";
      return <Tag>{children}</Tag>;
    },
    GcdsErrorSummary: ({ id, errorLinks }) => (
      <div id={id} data-testid="errorSummary">
        {Object.entries(errorLinks ?? {}).map(([href, message]) => (
          <a key={href} href={href}>
            {message}
          </a>
        ))}
      </div>
    ),
    GcdsInput: ({ inputId, label, value, errorMessage, onGcdsChange }) =>
      withError(
        <input
          aria-label={label}
          data-testid={inputId}
          value={value}
          onChange={(event) => onGcdsChange?.(event)}
        />,
        errorMessage,
      ),
    GcdsDateInput: ({ name, legend, value, errorMessage, onGcdsChange }) =>
      withError(
        <input
          aria-label={legend}
          data-testid={name}
          value={value}
          onChange={(event) => onGcdsChange?.(event)}
        />,
        errorMessage,
      ),
    GcdsSelect: ({
      selectId,
      label,
      value,
      children,
      errorMessage,
      onGcdsChange,
    }) =>
      withError(
        <select
          aria-label={label}
          data-testid={selectId}
          value={value}
          onChange={(event) => onGcdsChange?.(event)}
        >
          <option value="">-</option>
          {children}
        </select>,
        errorMessage,
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
  };
});

const option = (id, nameEn, overrides = {}) => ({
  id,
  name_en: nameEn,
  name_fr: nameEn,
  option_type: "country",
  canada_post_id: null,
  country_code: null,
  province_code: null,
  requires_proof: false,
  ...overrides,
});

const PASSPORT = {
  key: "PASSPORT",
  name_en: "Passport",
  name_fr: "Passeport",
  options: [
    option(1, "Canada", { country_code: "CA", requires_proof: true }),
    option(2, "France", { country_code: "FR", requires_proof: true }),
  ],
};

const DRIVERS_LICENCE = {
  key: "DRIVERS_LICENCE",
  name_en: "Driver's licence",
  name_fr: "Permis de conduire",
  options: [
    option(10, "Ontario", { option_type: "province", province_code: "ON" }),
    option(11, "Quebec", { option_type: "province", province_code: "QC" }),
  ],
};

const HEALTH_CARD = {
  key: "PROVINCIAL_HEALTH_CARD",
  name_en: "Health card",
  name_fr: "Carte santé",
  options: [
    option(20, "Quebec", {
      option_type: "province",
      province_code: "QC",
      requires_proof: true,
    }),
  ],
};

const PR_CARD = {
  key: "PERMANENT_RESIDENT_CARD",
  name_en: "PR card",
  name_fr: "Carte RP",
  options: [
    option(30, "Canada", {
      option_type: "value",
      country_code: "CA",
      requires_proof: true,
    }),
  ],
};

const renderPage = (document, state = {}) =>
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname:
            "/en/identity-verification/start/in-person/canada-post/id-details",
          state: document ? { document, ...state } : null,
        },
      ]}
    >
      <Routes>
        <Route
          path="/:language/identity-verification/:journeyType/in-person/canada-post/id-details"
          element={<CanadaPostIdDetailsPage />}
        />
        <Route
          path="/:language/identity-verification/:journeyType/in-person/canada-post"
          element={<div>select id page</div>}
        />
      </Routes>
    </MemoryRouter>,
  );

const change = (testId, value) =>
  fireEvent.change(screen.getByTestId(testId), { target: { value } });

const fillCommonFields = () => {
  change("id-expiry-date-input", "2099-01-01");
  change("first-name-input", "Jane");
  change("last-name-input", "Doe");
  change("date-of-birth-input", "1990-05-15");
  change("address-input", "123 Main St");
  change("city-town-input", "Ottawa");
  change("postal-code-input", "K1A 0B1");
};

describe("CanadaPostIdDetailsPage", () => {
  const t = i18n.getFixedT("en", "idv");

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

    const { container } = renderPage(PASSPORT);

    expect(container).toBeEmptyDOMElement();
  });

  it("redirects to the Select your ID page without a selected document", () => {
    renderPage(null);

    expect(screen.getByText("select id page")).toBeInTheDocument();
  });

  it("renders the passport form with API countries and a static province", () => {
    renderPage(PASSPORT);

    expect(
      screen.getByRole("heading", { name: "Enter your passport details" }),
    ).toBeInTheDocument();
    const issuer = screen.getByLabelText("What country issued the passport?");
    expect(
      Array.from(issuer.querySelectorAll("option")).map((o) => o.textContent),
    ).toEqual(["-", "Canada", "France"]);
    expect(screen.getByTestId("select-province")).toBeInTheDocument();
    expect(screen.queryByTestId("select-country")).not.toBeInTheDocument();
    expect(screen.getByTestId("postal-code-input")).toBeInTheDocument();
  });

  it("renders the driver's licence form with API provinces only", () => {
    renderPage(DRIVERS_LICENCE);

    expect(
      screen.getByRole("heading", {
        name: "Enter your driver's licence details",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Province/ Territory")).toHaveAttribute(
      "data-testid",
      "select-document-option",
    );
    expect(screen.queryByTestId("select-province")).not.toBeInTheDocument();
    expect(screen.queryByTestId("select-country")).not.toBeInTheDocument();
  });

  it("renders the default form with a country select and preselects a single option", () => {
    renderPage(HEALTH_CARD);

    expect(
      screen.getByRole("heading", { name: "Enter your ID details" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("select-country")).toHaveValue("CA");
    expect(screen.getByTestId("select-document-option")).toHaveValue("20");
  });

  it("renders the default form with a static province for non-province documents", () => {
    renderPage(PR_CARD);

    expect(screen.getByTestId("select-document-option")).toHaveValue("30");
    expect(screen.getByTestId("select-province")).toBeInTheDocument();
    expect(screen.queryByTestId("select-country")).not.toBeInTheDocument();
  });

  it("shows validation errors when continuing with an empty form", () => {
    renderPage(PASSPORT);

    fireEvent.click(screen.getByTestId("continue-button"));

    const summary = screen.getByTestId("errorSummary");
    expect(summary).toHaveTextContent(getIdExpiryRequiredMessage(t));
    expect(summary).toHaveTextContent(getPostalCodeRequiredOrInvalidMessage(t));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("rejects IDs expiring in less than one month", () => {
    renderPage(DRIVERS_LICENCE);
    fillCommonFields();
    change("select-document-option", "10");
    change("id-expiry-date-input", new Date().toISOString().slice(0, 10));

    fireEvent.click(screen.getByTestId("continue-button"));

    expect(screen.getByTestId("errorSummary")).toHaveTextContent(
      getIdExpiryTooSoonMessage(t),
    );
  });

  it("navigates to the proof of address page when the option requires proof", () => {
    renderPage(PASSPORT);
    fillCommonFields();
    change("select-document-option", "2");
    change("select-province", "ON");

    fireEvent.click(screen.getByTestId("continue-button"));

    expect(screen.queryByTestId("errorSummary")).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/identity-verification/start/in-person/canada-post/proof-of-address",
      {
        state: {
          document: PASSPORT,
          formData: {
            idExpiryDate: "2099-01-01",
            documentOptionId: "2",
            country: "",
            province: "ON",
            firstName: "Jane",
            lastName: "Doe",
            dateOfBirth: "1990-05-15",
            address: "123 Main St",
            cityTown: "Ottawa",
            postalCode: "K1A 0B1",
          },
        },
      },
    );
  });

  it("does nothing on continue when no proof of address is required", () => {
    renderPage(DRIVERS_LICENCE);
    fillCommonFields();
    change("select-document-option", "10");

    fireEvent.click(screen.getByTestId("continue-button"));

    expect(screen.queryByTestId("errorSummary")).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does not show proof of address again after it was acknowledged", () => {
    renderPage(PR_CARD, { proofOfAddressAcknowledged: true });
    fillCommonFields();
    change("select-province", "ON");

    fireEvent.click(screen.getByTestId("continue-button"));

    expect(screen.queryByTestId("errorSummary")).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("checks a foreign licence option separately from domestic licences", () => {
    renderPage({
      ...DRIVERS_LICENCE,
      options: [
        ...DRIVERS_LICENCE.options,
        option(12, "Foreign licence", { requires_proof: true }),
      ],
    });
    fillCommonFields();
    change("select-document-option", "12");
    change("select-province", "ON");

    fireEvent.click(screen.getByTestId("continue-button"));

    expect(screen.queryByTestId("errorSummary")).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/identity-verification/start/in-person/canada-post/proof-of-address",
      {
        state: {
          document: {
            ...DRIVERS_LICENCE,
            options: [
              ...DRIVERS_LICENCE.options,
              option(12, "Foreign licence", { requires_proof: true }),
            ],
          },
          formData: {
            idExpiryDate: "2099-01-01",
            documentOptionId: "12",
            country: "",
            province: "ON",
            firstName: "Jane",
            lastName: "Doe",
            dateOfBirth: "1990-05-15",
            address: "123 Main St",
            cityTown: "Ottawa",
            postalCode: "K1A 0B1",
          },
        },
      },
    );
  });

  it("restores form values provided in navigation state", () => {
    const formData = {
      idExpiryDate: "2099-01-01",
      documentOptionId: "2",
      country: "",
      province: "ON",
      firstName: "Jane",
      lastName: "Doe",
      dateOfBirth: "1990-05-15",
      address: "123 Main St",
      cityTown: "Ottawa",
      postalCode: "K1A 0B1",
    };

    renderPage(PASSPORT, { formData });

    expect(screen.getByTestId("id-expiry-date-input")).toHaveValue(
      formData.idExpiryDate,
    );
    expect(screen.getByTestId("select-document-option")).toHaveValue(
      formData.documentOptionId,
    );
    expect(screen.getByTestId("select-province")).toHaveValue(
      formData.province,
    );
    expect(screen.getByTestId("first-name-input")).toHaveValue(
      formData.firstName,
    );
    expect(screen.getByTestId("last-name-input")).toHaveValue(
      formData.lastName,
    );
    expect(screen.getByTestId("date-of-birth-input")).toHaveValue(
      formData.dateOfBirth,
    );
    expect(screen.getByTestId("address-input")).toHaveValue(formData.address);
    expect(screen.getByTestId("city-town-input")).toHaveValue(
      formData.cityTown,
    );
    expect(screen.getByTestId("postal-code-input")).toHaveValue(
      formData.postalCode,
    );
  });

  it("goes back to the previous page", () => {
    renderPage(PASSPORT);

    fireEvent.click(screen.getByTestId("back-button"));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
