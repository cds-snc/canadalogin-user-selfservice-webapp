import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const loadComponent = async (isDevOnlyFeatureEnabled = true) => {
  vi.resetModules();

  vi.doMock("../../utils/constants", () => ({
    DEV_ONLY_FEATURE: isDevOnlyFeatureEnabled,
  }));

  vi.doMock("@gcds-core/components-react", () => ({
    GcdsNotice: ({ noticeTitle }: { noticeTitle: string }) => (
      <div data-testid="success-notice">{noticeTitle}</div>
    ),
  }));

  const module = await import("./IdentityInfoSuccessNotice");
  return module.default;
};

afterEach(() => {
  vi.doUnmock("../../utils/constants");
  vi.doUnmock("@gcds-core/components-react");
  vi.clearAllMocks();
  vi.resetModules();
});

describe("IdentityInfoSuccessNotice", () => {
  it("renders the success notice when enabled", async () => {
    const IdentityInfoSuccessNotice = await loadComponent(true);

    render(<IdentityInfoSuccessNotice showIDVSuccessNotice={true} />);

    expect(screen.getByTestId("success-notice").textContent).toContain(
      "Your information was successfully updated in CanadaLogin",
    );
  });

  it("does not render when showIDVSuccessNotice is false", async () => {
    const IdentityInfoSuccessNotice = await loadComponent(true);

    render(<IdentityInfoSuccessNotice showIDVSuccessNotice={false} />);

    expect(screen.queryByTestId("success-notice")).toBeNull();
  });

  it("does not render when dev-only feature is disabled", async () => {
    const IdentityInfoSuccessNotice = await loadComponent(false);

    render(<IdentityInfoSuccessNotice showIDVSuccessNotice={true} />);

    expect(screen.queryByTestId("success-notice")).toBeNull();
  });
});
