import "@testing-library/jest-dom/vitest";
import React from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RootLayout from "../RootLayout";

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsText: ({ children, ...props }) => <p {...props}>{children}</p>,
}));

vi.mock("../Header", () => ({
  default: () => <div data-testid="header" />,
}));

vi.mock("../Footer", () => ({
  default: () => (
    <div data-testid="footer">
      <a href="#footer-link">Footer link</a>
    </div>
  ),
}));

vi.mock("../../Providers/LanguageProvider", () => ({
  useLanguage: () => ({ state: { language: "en" } }),
}));

vi.mock("../../../hooks/useRelyingPartyAnalyticsParams", () => ({
  useRelyingPartyAnalyticsParams: () => ({}),
}));

vi.mock("../../../utils/gatag", () => ({
  setAnalyticsContext: vi.fn(),
  trackPage: vi.fn(),
}));

function SameUrlWizardPage() {
  const [step, setStep] = React.useState("step-one");

  if (step === "step-one") {
    return (
      <div>
        <h1>Wizard Step One</h1>
        <button type="button" onClick={() => setStep("step-two")}>
          Continue
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>Wizard Step Two</h1>
      <p>Second step content</p>
    </div>
  );
}

function setup(initialEntry = "/step-one") {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <RootLayout />,
        children: [
          {
            path: "step-one",
            element: (
              <div>
                <h1>Step One</h1>
                <button type="button">Continue</button>
              </div>
            ),
          },
          {
            path: "step-two",
            element: (
              <div>
                <h1>Step Two</h1>
              </div>
            ),
          },
          {
            path: "custom",
            element: (
              <div>
                <div data-page-focus-target>Summary</div>
                <h1>Custom</h1>
              </div>
            ),
          },
          {
            path: "wizard",
            element: <SameUrlWizardPage />,
          },
        ],
      },
    ],
    { initialEntries: [initialEntry] },
  );

  render(<RouterProvider router={router} />);
  return { router };
}

describe("RootLayout keyboard focus behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    vi.spyOn(window, "scrollY", "get").mockReturnValue(0);
  });

  it("does not auto-focus on route render", async () => {
    setup();

    await screen.findByRole("heading", { name: "Step One" });

    expect(document.activeElement).not.toBe(
      screen.getByRole("heading", { name: "Step One" }),
    );
  });

  it("restores scrolling without injecting an inline script", async () => {
    const { router } = setup();

    expect(document.querySelector("script:not([src])")).toBeNull();
    window.scrollTo.mockClear();

    await act(() => router.navigate("/step-two"));

    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0);
    expect(document.querySelector("script:not([src])")).toBeNull();
  });

  it("does not reset the scroll position on initial load", () => {
    setup();

    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("disables native restoration while mounted and restores it on unmount", () => {
    const previousRestoration = window.history.scrollRestoration;
    setup();

    expect(window.history.scrollRestoration).toBe("manual");

    cleanup();

    expect(window.history.scrollRestoration).toBe(previousRestoration);
  });

  it("uses first-tab interception after client-side navigation", async () => {
    const { router } = setup();

    await router.navigate("/step-two");
    const heading = await screen.findByRole("heading", { name: "Step Two" });

    const wasIntercepted = !fireEvent.keyDown(window, { key: "Tab" });

    expect(wasIntercepted).toBe(true);
    expect(heading).toHaveFocus();
  });

  it.each([false, true])(
    "scrolls new pages to the top without moving focus (replace: %s)",
    async (replace) => {
      const { router } = setup();
      const footerLink = screen.getByRole("link", { name: "Footer link" });
      footerLink.focus();
      vi.spyOn(window, "scrollY", "get").mockReturnValue(1800);
      window.scrollTo.mockClear();

      await act(() => router.navigate("/step-two", { replace }));

      expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0);
      expect(footerLink).toHaveFocus();
    },
  );

  it("restores scroll position on Back and Forward navigation", async () => {
    const { router } = setup();
    vi.spyOn(window, "scrollY", "get").mockReturnValue(1200);

    await act(() => router.navigate("/step-two"));
    vi.spyOn(window, "scrollY", "get").mockReturnValue(600);

    await act(() => router.navigate(-1));
    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 1200);

    await act(() => router.navigate(1));
    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 600);
  });

  it("preserves anchor navigation instead of resetting to the top", async () => {
    const { router } = setup();
    const footerLink = screen.getByRole("link", { name: "Footer link" });
    footerLink.id = "footer-link";
    const scrollIntoView = vi.fn();
    footerLink.scrollIntoView = scrollIntoView;
    window.scrollTo.mockClear();

    await act(() => router.navigate("/step-two#footer-link"));

    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(fireEvent.keyDown(window, { key: "Tab" })).toBe(true);
  });

  it("scrolls to URL-encoded anchor targets", async () => {
    const { router } = setup();
    const footerLink = screen.getByRole("link", { name: "Footer link" });
    footerLink.id = "footer link";
    footerLink.scrollIntoView = vi.fn();
    window.scrollTo.mockClear();

    await act(() => router.navigate("/step-two#footer%20link"));

    expect(footerLink.scrollIntoView).toHaveBeenCalledOnce();
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("starts at the top when the anchor target does not exist", async () => {
    const { router } = setup();

    await act(() => router.navigate("/step-two#missing"));

    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0);
  });

  it("restores saved positions before following anchors on Back", async () => {
    const { router } = setup("/step-one#footer-link");
    const footerLink = screen.getByRole("link", { name: "Footer link" });
    footerLink.id = "footer-link";
    footerLink.scrollIntoView = vi.fn();
    vi.spyOn(window, "scrollY", "get").mockReturnValue(400);

    await act(() => router.navigate("/step-two"));
    await act(() => router.navigate(-1));

    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 400);
    expect(footerLink.scrollIntoView).not.toHaveBeenCalled();
  });

  it("resets scroll position when navigating to the same URL", async () => {
    const { router } = setup();
    vi.spyOn(window, "scrollY", "get").mockReturnValue(1800);
    window.scrollTo.mockClear();

    await act(() => router.navigate("/step-one"));

    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0);
  });

  it("resets scroll position when query parameters change", async () => {
    const { router } = setup();
    window.scrollTo.mockClear();

    await act(() => router.navigate("/step-one?view=updated"));

    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0);
  });

  it("uses first-tab interception after navigation when footer had focus", async () => {
    const { router } = setup();

    const footerLink = screen.getByRole("link", { name: "Footer link" });
    footerLink.focus();
    expect(footerLink).toHaveFocus();

    await router.navigate("/step-two");
    const heading = await screen.findByRole("heading", { name: "Step Two" });

    const wasIntercepted = !fireEvent.keyDown(window, { key: "Tab" });

    expect(wasIntercepted).toBe(true);
    expect(footerLink).not.toHaveFocus();
    expect(heading).toHaveFocus();
  });

  it("does not intercept first Tab on initial load/refresh", async () => {
    setup("/step-two");

    const heading = await screen.findByRole("heading", { name: "Step Two" });

    const wasIntercepted = !fireEvent.keyDown(window, { key: "Tab" });

    expect(wasIntercepted).toBe(false);
    expect(heading).not.toHaveFocus();
  });

  it("does not force focus to page heading when in-page content changes", async () => {
    setup("/wizard");

    const stepOneHeading = await screen.findByRole("heading", {
      name: "Wizard Step One",
    });

    fireEvent.keyDown(window, { key: "Tab" });
    expect(stepOneHeading).not.toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    const stepTwoHeading = await screen.findByRole("heading", {
      name: "Wizard Step Two",
    });

    fireEvent.keyDown(window, { key: "Tab" });
    expect(stepTwoHeading).not.toHaveFocus();
  });
});
