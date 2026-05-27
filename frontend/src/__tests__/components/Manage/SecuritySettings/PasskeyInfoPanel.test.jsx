/**
 * Unit tests for PasskeyInfoPanel component
 *
 * Tests verify:
 * - All informational text sections are rendered
 * - Privacy notice and learn more links are rendered
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import PasskeyInfoPanel from "../../../../components/Manage/SecuritySettings/components/PasskeyInfoPanel";

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }) => <div>{children}</div>,
  GcdsText: ({ children }) => <div>{children}</div>,
  GcdsLink: ({ children, href, target }) => (
    <a href={href} target={target}>
      {children}
    </a>
  ),
}));

describe("PasskeyInfoPanel", () => {
  it("renders the simpler sign-in heading", () => {
    render(<PasskeyInfoPanel />);
    expect(
      screen.getByText("With passkeys, sign in becomes simpler."),
    ).toBeInTheDocument();
  });

  it("renders the 'What are passkeys?' heading", () => {
    render(<PasskeyInfoPanel />);
    expect(screen.getByText("What are passkeys?")).toBeInTheDocument();
  });

  it("renders the passkeys description text", () => {
    render(<PasskeyInfoPanel />);
    expect(
      screen.getByText(
        "Passkeys are encrypted digital keys you create using your fingerprint, face, or screen lock.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the 'Where are passkeys saved?' heading", () => {
    render(<PasskeyInfoPanel />);
    expect(screen.getByText("Where are passkeys saved?")).toBeInTheDocument();
  });

  it("renders the saved description text", () => {
    render(<PasskeyInfoPanel />);
    expect(
      screen.getByText(
        "Passkeys are often saved to your password manager, so you can sign in on other devices. Sometimes they are saved directly to your device.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the 'How is my information used?' heading", () => {
    render(<PasskeyInfoPanel />);
    expect(screen.getByText("How is my information used?")).toBeInTheDocument();
  });

  it("renders the privacy notice link", () => {
    render(<PasskeyInfoPanel />);
    const privacyLink = screen.getByRole("link", { name: "privacy notice" });
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute("href", "#");
  });

  it("renders the 'Learn more about passkeys' link", () => {
    render(<PasskeyInfoPanel />);
    const learnMoreLink = screen.getByRole("link", {
      name: "Learn more about passkeys",
    });
    expect(learnMoreLink).toBeInTheDocument();
    expect(learnMoreLink).toHaveAttribute("href", "#");
  });

  it("opens privacy notice link in a new tab", () => {
    render(<PasskeyInfoPanel />);
    const privacyLink = screen.getByRole("link", { name: "privacy notice" });
    expect(privacyLink).toHaveAttribute("target", "_blank");
  });

  it("opens learn more link in a new tab", () => {
    render(<PasskeyInfoPanel />);
    const learnMoreLink = screen.getByRole("link", {
      name: "Learn more about passkeys",
    });
    expect(learnMoreLink).toHaveAttribute("target", "_blank");
  });
});
