import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useFirstTabPageFocus } from "../useFirstTabPageFocus";

function HookHarness() {
  useFirstTabPageFocus({
    pathname: "/en/idv",
    search: "",
    hash: "",
    enabled: true,
  });

  return (
    <main id="main-content">
      <h1>Get ready to visit a Service Canada Centre</h1>
      <input aria-label="First Name" />
      <input aria-label="Last Name" />
    </main>
  );
}

function HookHarnessWithSkipLink() {
  return <HookHarnessWithSkipLinkAndPath pathname="/en/idv" />;
}

function HookHarnessWithSkipLinkAndPath({ pathname }: { pathname: string }) {
  useFirstTabPageFocus({
    pathname,
    search: "",
    hash: "",
    enabled: true,
  });

  return (
    <>
      <a href="#main-content">Skip to main content</a>
      <main id="main-content">
        <h1>Get ready to visit a Service Canada Centre</h1>
        <input aria-label="First Name" />
        <input aria-label="Last Name" />
      </main>
    </>
  );
}

describe("useFirstTabPageFocus", () => {
  it("focuses the page heading on first Tab when no field is focused", async () => {
    const user = userEvent.setup();

    render(<HookHarness />);

    await user.tab();

    expect(document.activeElement).toBe(
      screen.getByRole("heading", {
        level: 1,
        name: "Get ready to visit a Service Canada Centre",
      }),
    );
  });

  it("focuses the heading before the skip link on first Tab", async () => {
    const user = userEvent.setup();

    render(<HookHarnessWithSkipLink />);

    await user.tab();

    expect(document.activeElement).toBe(
      screen.getByRole("heading", {
        level: 1,
        name: "Get ready to visit a Service Canada Centre",
      }),
    );
  });

  it("focuses the heading on first Tab even when initial focus is inside main content", async () => {
    const user = userEvent.setup();

    render(<HookHarnessWithSkipLink />);

    const firstNameInput = screen.getByLabelText("First Name");
    firstNameInput.focus();

    await user.tab();

    expect(document.activeElement).toBe(
      screen.getByRole("heading", {
        level: 1,
        name: "Get ready to visit a Service Canada Centre",
      }),
    );
  });

  it("preserves native tab order after mouse focus inside main content", async () => {
    const user = userEvent.setup();

    render(<HookHarness />);

    const firstNameInput = screen.getByLabelText("First Name");
    const lastNameInput = screen.getByLabelText("Last Name");

    await user.click(firstNameInput);
    await user.tab();

    expect(document.activeElement).toBe(lastNameInput);
  });

  it("resets pointer intent on navigation so first Tab still focuses heading", async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <HookHarnessWithSkipLinkAndPath pathname="/en/idv-step-1" />,
    );

    const firstNameInputStep1 = screen.getByLabelText("First Name");
    await user.click(firstNameInputStep1);

    rerender(<HookHarnessWithSkipLinkAndPath pathname="/en/idv-step-2" />);

    await user.tab();

    expect(document.activeElement).toBe(
      screen.getByRole("heading", {
        level: 1,
        name: "Get ready to visit a Service Canada Centre",
      }),
    );
  });
});
