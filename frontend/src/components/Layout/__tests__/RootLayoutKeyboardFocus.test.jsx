import "@testing-library/jest-dom/vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
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
  });

  it("does not auto-focus on route render", async () => {
    setup();

    await screen.findByRole("heading", { name: "Step One" });

    expect(document.activeElement).not.toBe(
      screen.getByRole("heading", { name: "Step One" }),
    );
  });

  it("uses first-tab interception after client-side navigation", async () => {
    const { router } = setup();

    await router.navigate("/step-two");
    const heading = await screen.findByRole("heading", { name: "Step Two" });

    const wasIntercepted = !fireEvent.keyDown(window, { key: "Tab" });

    expect(wasIntercepted).toBe(true);
    expect(heading).toHaveFocus();
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
