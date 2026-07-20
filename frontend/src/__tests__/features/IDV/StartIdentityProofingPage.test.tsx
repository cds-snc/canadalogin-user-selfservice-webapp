import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StartIdentityProofingPage from "../../../features/IDV/StartIdentityProofingPage";
import { PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";

let mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ language: "en", journeyType: "start" }),
  };
});

vi.mock("../../../components/Providers/useUser", () => ({
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

vi.mock(
  "../../../features/IDV/components/IdentityProofingRadioButtons",
  () => ({
    default: ({
      onOptionChange,
    }: {
      onOptionChange: (option: "online" | "inPerson" | "cantProveNow") => void;
    }) => (
      <div>
        <button type="button" onClick={() => onOptionChange("inPerson")}>
          pick in person
        </button>
        <button type="button" onClick={() => onOptionChange("online")}>
          pick online
        </button>
        <button type="button" onClick={() => onOptionChange("cantProveNow")}>
          pick later
        </button>
      </div>
    ),
  }),
);

vi.mock("react-i18next", async () => {
  const actual =
    await vi.importActual<typeof import("react-i18next")>("react-i18next");

  return {
    ...actual,
    useTranslation: (namespace?: string) => {
      if (namespace === "layout") {
        return {
          t: () => "CanadaLogin",
        };
      }

      return {
        i18n: { language: "en" },
        t: (key: string) => {
          const translations: Record<string, string> = {
            "StartIdentityProofing.pageTitle":
              "To access RP SERVICE PORTAL, prove your identity first",
            "StartIdentityProofing.proveYourIdentity": "Prove your identity",
            "StartIdentityProofing.heading":
              "Use CanadaLogin to prove your identity",
            "StartIdentityProofing.bodyText": "Body text",
            "StartIdentityProofing.learnMoreDescription": "Learn more",
            "StartIdentityProofing.howToProveHeading":
              "How do you want to prove your identity?",
            "ServiceCanadaCentre.continueButton": "Continue",
            "Button.cancel": "Cancel",
            "StartIdentityProofing.signedInSuccessNotice": "Signed in",
            "StartIdentityProofing.errorNoticeTitle": "Error title",
            "StartIdentityProofing.errorNoticeDescription": "Error description",
            "StartIdentityProofing.fallbackRpName": "RP Name",
          };

          return translations[key] ?? key;
        },
      };
    },
  };
});

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  GcdsGrid: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
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
  GcdsLink: ({ children }: { children: React.ReactNode }) => (
    <a href="#">{children}</a>
  ),
  GcdsNotice: ({
    children,
    noticeTitle,
  }: {
    children: React.ReactNode;
    noticeTitle: string;
  }) => (
    <section>
      <h2>{noticeTitle}</h2>
      {children}
    </section>
  ),
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

describe("StartIdentityProofingPage", () => {
  beforeEach(() => {
    mockNavigate = vi.fn();
  });

  it("navigates to the new in-person route when in-person option is selected", () => {
    render(<StartIdentityProofingPage />);

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "pick in person" }));
    fireEvent.click(continueButton);

    expect(mockNavigate).toHaveBeenCalledWith(
      path(PAGES.idvProveIdentityInPersonPage, {
        language: "en",
        journeyType: "start",
      }),
    );
  });

  it("keeps existing online navigation behavior", () => {
    render(<StartIdentityProofingPage />);

    fireEvent.click(screen.getByRole("button", { name: "pick online" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(mockNavigate).toHaveBeenCalledWith(
      path(PAGES.idvProveIdentityOnlinePage, {
        language: "en",
        journeyType: "start",
      }),
    );
  });
});
