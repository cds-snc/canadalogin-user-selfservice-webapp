import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import IdentityInfoSuccessNotice from "../../../features/IDV/IdentityInfoSuccessNotice";

let mockDevOnlyFeature = true;

vi.mock("../../../utils/constants", () => ({
  get DEV_ONLY_FEATURE() {
    return mockDevOnlyFeature;
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key === "ProfileHome.successNoticeTitle"
        ? "Your information was successfully updated in CanadaLogin"
        : key,
  }),
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsNotice: ({
    children,
    noticeRole,
    noticeTitle,
  }: {
    children: React.ReactNode;
    noticeRole?: string;
    noticeTitle?: string;
  }) => (
    <div
      data-testid="success-notice"
      data-notice-role={noticeRole}
      data-notice-title={noticeTitle}
    >
      {children}
    </div>
  ),
}));

afterEach(() => {
  mockDevOnlyFeature = true;
});

describe("IdentityInfoSuccessNotice", () => {
  it("renders the translated success notice when enabled", () => {
    render(<IdentityInfoSuccessNotice showIDVSuccessNotice={true} />);

    const notice = screen.getByTestId("success-notice");
    expect(notice.getAttribute("data-notice-role")).toBe("success");
    expect(notice.getAttribute("data-notice-title")).toBe(
      "Your information was successfully updated in CanadaLogin",
    );
  });

  it("does not render when the notice flag is off", () => {
    render(<IdentityInfoSuccessNotice showIDVSuccessNotice={false} />);

    expect(screen.queryByTestId("success-notice")).toBeNull();
  });

  it("does not render when the dev-only feature is disabled", () => {
    mockDevOnlyFeature = false;

    render(<IdentityInfoSuccessNotice showIDVSuccessNotice={true} />);

    expect(screen.queryByTestId("success-notice")).toBeNull();
  });
});
