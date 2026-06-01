import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Link, MemoryRouter, Route, Routes } from "react-router";

import ReactGA from "react-ga4";
import config from "../../config";
import { usePageTracking } from "../usePageTracking";

vi.mock("react-ga4", () => ({
  default: {
    send: vi.fn(),
  },
}));

function TrackingHarness() {
  usePageTracking();

  return (
    <>
      <Link to="/fr/manage?from=settings">Go next</Link>
      <div>tracking-harness</div>
    </>
  );
}

describe("hooks/usePageTracking", () => {
  const originalEnvironment = config.environment;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    config.environment = originalEnvironment;
    vi.restoreAllMocks();
  });

  it("sends a pageview on initial render and on route changes", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/en/security?step=1"]}>
        <Routes>
          <Route path="*" element={<TrackingHarness />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(ReactGA.send).toHaveBeenCalledWith({
      hitType: "pageview   ",
      page: "/en/security?step=1",
    });

    await user.click(
      document.querySelector('a[href="/fr/manage?from=settings"]') as Element,
    );

    expect(ReactGA.send).toHaveBeenCalledWith({
      hitType: "pageview   ",
      page: "/fr/manage?from=settings",
    });
    expect(ReactGA.send).toHaveBeenCalledTimes(2);
  });

  it("logs pageview in dev only", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    config.environment = "dev";
    render(
      <MemoryRouter initialEntries={["/en/profile"]}>
        <Routes>
          <Route path="*" element={<TrackingHarness />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(consoleSpy).toHaveBeenCalledWith("GA Pageview:", "/en/profile");

    consoleSpy.mockClear();
    config.environment = "test";

    render(
      <MemoryRouter initialEntries={["/en/dashboard"]}>
        <Routes>
          <Route path="*" element={<TrackingHarness />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
