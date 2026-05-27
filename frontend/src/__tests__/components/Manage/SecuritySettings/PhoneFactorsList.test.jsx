import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import PhoneFactorsList from "../../../../components/Manage/SecuritySettings/components/PhoneFactorsList";

const mockNavigate = vi.fn();

vi.mock("react-router", () => ({
  useParams: () => ({ language: "en" }),
  useNavigate: () => mockNavigate,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) =>
      ({
        "Manage2FAVerifications.textMessage": "Text message (SMS)",
        "Manage2FAVerifications.voiceCall": "Voice call",
        "Manage2FAVerifications.codesSentBy": "Codes sent by",
        "Manage2FAVerifications.deleteButton": "Delete",
      })[key] ?? key,
  }),
}));

vi.mock("../../../../utils/constants", () => ({
  PAGES: {
    deleteMFAPage: "DeleteMFAPage",
  },
}));

vi.mock("../../../../utils/routeHelpers", () => ({
  path: (_page, { language } = {}) => `/${language}/delete-mfa`,
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }) => <div>{children}</div>,
  GcdsText: ({ children }) => <div>{children}</div>,
  GcdsButton: ({ children, onGcdsClick, disabled }) => (
    <button onClick={onGcdsClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

describe("PhoneFactorsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("disables delete when removing the phone number would remove the last remaining 2FA factors", () => {
    render(
      <PhoneFactorsList
        userPhoneFactorsMap={{
          "+1 555 123 4567": [
            { id: "factor-1", type: "smsotp" },
            { id: "factor-2", type: "voiceotp" },
          ],
        }}
        totalFactorCount={2}
      />,
    );

    expect(
      screen.queryByRole("button", {
        name: "Delete",
      }),
    ).not.toBeInTheDocument();
  });

  it("enables delete when another 2FA factor remains after removing the phone number", async () => {
    render(
      <PhoneFactorsList
        userPhoneFactorsMap={{
          "+1 555 123 4567": [
            { id: "factor-1", type: "smsotp" },
            { id: "factor-2", type: "voiceotp" },
          ],
        }}
        totalFactorCount={3}
      />,
    );

    const deleteButton = screen.getByRole("button", {
      name: "Delete",
    });

    expect(deleteButton).toBeEnabled();

    await userEvent.click(deleteButton);

    expect(mockNavigate).toHaveBeenCalledWith("/en/delete-mfa", {
      state: {
        phoneNumber: "+1 555 123 4567",
        factorIds: ["factor-1", "factor-2"],
        formattedPhoneNumber: "+1 555 123 4567",
      },
    });
  });
});
