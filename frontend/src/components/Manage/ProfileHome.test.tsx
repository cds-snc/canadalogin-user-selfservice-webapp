import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { mockIdentityInfoSuccessNotice } = vi.hoisted(() => ({
  mockIdentityInfoSuccessNotice: vi.fn(
    ({ showIDVSuccessNotice }: { showIDVSuccessNotice?: boolean }) => (
      <div data-testid="idv-success-notice">{String(showIDVSuccessNotice)}</div>
    ),
  ),
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }: { children: unknown }) => <div>{children}</div>,
  GcdsHeading: ({ children }: { children: unknown }) => <h2>{children}</h2>,
  GcdsGrid: ({ children }: { children: unknown }) => <div>{children}</div>,
  GcdsText: ({ children }: { children: unknown }) => <p>{children}</p>,
  GcdsLink: ({ children }: { children: unknown }) => <a>{children}</a>,
}));

vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");

  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ language: "en" }),
  };
});

vi.mock("../../utils/routeHelpers", () => ({
  path: () => "/mock-edit-email",
}));

vi.mock("../Providers/useUser", () => ({
  useUser: () => ({
    state: {
      userProfile: {
        userName: "test@example.com",
        phoneNumbers: [],
      },
    },
  }),
}));

vi.mock("../Badges/VerifiedBadge", () => ({
  default: () => <div>VerifiedBadge</div>,
}));

vi.mock("../../features/ContactPhoneNumber/components/ViewContactPhoneNumber", () => ({
  default: () => <div>ViewContactPhoneNumber</div>,
}));

vi.mock("../../features/ProfileName/components/ViewProfileNameCard", () => ({
  default: () => <div>ViewNameCard</div>,
}));

vi.mock("../../features/LanguagePreference/components/ViewLanguagePreference", () => ({
  default: () => <div>ViewLanguagePreferences</div>,
}));

vi.mock("../../features/IDV/ProvenInformationCard", () => ({
  default: () => <div>ProvenInformationCard</div>,
}));

vi.mock("../../features/IDV/IdentityInfoSuccessNotice", () => ({
  default: mockIdentityInfoSuccessNotice,
}));

import ProfileHome from "./ProfileHome";

afterEach(() => {
  mockIdentityInfoSuccessNotice.mockClear();
});

describe("ProfileHome", () => {
  it("passes false by default to IdentityInfoSuccessNotice", () => {
    render(<ProfileHome />);

    expect(
      mockIdentityInfoSuccessNotice.mock.calls[0]?.[0]?.showIDVSuccessNotice,
    ).toBe(false);
  });

  it("passes true to IdentityInfoSuccessNotice when requested", () => {
    render(<ProfileHome showIDVSuccessNotice={true} />);

    expect(
      mockIdentityInfoSuccessNotice.mock.calls[0]?.[0]?.showIDVSuccessNotice,
    ).toBe(true);
  });
});
