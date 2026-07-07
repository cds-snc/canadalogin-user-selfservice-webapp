import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProveIdentityInPersonPage from "../../../../features/IDV/InPerson/ProveIdentityInPersonPage";
import { PAGES } from "../../../../utils/constants";
import { path } from "../../../../utils/routeHelpers";

let mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>(
    "react-router",
  );

  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ language: "en", journeyType: "start" }),
  };
});

vi.mock("../../../../components/Providers/useUser", () => ({
  useUser: () => ({
    state: {
      relyingPartyInfo: {
        localized: {
          en: { name: "RP SERVICE PORTAL" },
        },
        linkName: "RP Name",
      },
    },
  }),
}));

vi.mock("../../../../features/IDV/components/InPersonRadioButtons", () => ({
  default: ({
    onMethodChange,
  }: {
    onMethodChange: (method: "canadaPostLocations" | "serviceCanadaLocations") => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() => onMethodChange("canadaPostLocations")}
      >
        pick canada post
      </button>
      <button
        type="button"
        onClick={() => onMethodChange("serviceCanadaLocations")}
      >
        pick service canada
      </button>
    </div>
  ),
}));

vi.mock("react-i18next", async () => {
  const actual = await vi.importActual<typeof import("react-i18next")>(
    "react-i18next",
  );

  return {
    ...actual,
    useTranslation: () => ({
      i18n: { language: "en" },
      t: (key: string, values?: Record<string, string>) => {
        const translations: Record<string, string> = {
          "ProveIdentityInPerson.heading": "Prove your identity in person",
          "ProveIdentityInPerson.description":
            "You will only get access to this {{rpName}} after proving your identity in person and signing back in with your CanadaLogin.",
          "ProveIdentityInPerson.continueButton": "Continue",
          "ProveIdentityInPerson.backButton": "Back",
          "StartIdentityProofing.fallbackRpName": "RP Name",
        };

        const text = translations[key] ?? key;
        if (values?.rpName) {
          return text.replace("{{rpName}}", values.rpName);
        }

        return text;
      },
    }),
  };
});

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  GcdsGrid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GcdsHeading: ({
    children,
    tag,
  }: {
    children: React.ReactNode;
    tag: "h1" | "h2";
  }) => {
    if (tag === "h2") {
      return <h2>{children}</h2>;
    }

    return <h1>{children}</h1>;
  },
  GcdsText: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  GcdsButton: ({
    children,
    disabled,
    onGcdsClick,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    onGcdsClick: (event: Event) => void;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => onGcdsClick(event as unknown as Event)}
    >
      {children}
    </button>
  ),
}));

describe("ProveIdentityInPersonPage", () => {
  beforeEach(() => {
    mockNavigate = vi.fn();
  });

  it("renders heading and RP-specific description", () => {
    render(<ProveIdentityInPersonPage />);

    expect(
      screen.getByRole("heading", { name: "Prove your identity in person" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "You will only get access to this RP SERVICE PORTAL after proving your identity in person and signing back in with your CanadaLogin.",
      ),
    ).toBeInTheDocument();
  });

  it("navigates back to Start Identity Proofing page", () => {
    render(<ProveIdentityInPersonPage />);

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(mockNavigate).toHaveBeenCalledWith(
      path(PAGES.idvStartIdentityProofingPage, {
        language: "en",
        journeyType: "start",
      }),
    );
  });

  it("navigates to Canada Post page when Canada Post option is selected", () => {
    render(<ProveIdentityInPersonPage />);

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "pick canada post" }));
    fireEvent.click(continueButton);

    expect(mockNavigate).toHaveBeenCalledWith(
      path(PAGES.idvVisitCanadaPostPage, {
        language: "en",
        journeyType: "start",
      }),
    );
  });

  it("navigates to Service Canada page when Service Canada option is selected", () => {
    render(<ProveIdentityInPersonPage />);

    fireEvent.click(screen.getByRole("button", { name: "pick service canada" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(mockNavigate).toHaveBeenCalledWith(
      path(PAGES.idvServiceCanadaCentrePage, {
        language: "en",
        journeyType: "start",
      }),
    );
  });
});
