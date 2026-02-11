import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, beforeEach, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import NoticeFactory from "../../../components/InfoBlocks/NoticeFactory";

// Mock react-router useParams
const mockUseParams = vi.fn();
vi.mock("react-router", () => ({
  useParams: () => mockUseParams(),
}));

// Mock GCDS components
vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsNotice: ({ children, type, noticeTitleTag, noticeTitle, ...props }) => (
    <div
      data-testid="gcds-notice"
      data-type={type}
      data-notice-title-tag={noticeTitleTag}
      data-notice-title={noticeTitle}
      {...props}
    >
      {children}
    </div>
  ),
  GcdsText: ({ children, ...props }) => (
    <div data-testid="gcds-text" {...props}>
      {children}
    </div>
  ),
}));

// Mock utility functions
vi.mock("../../../utils/functions", () => ({
  getPageContent: () => ({
    1: "Two-step verification for",
    2: "has been removed.",
    3: "Two-step verification via text message to",
    4: "has been added to your account.",
  }),
}));

vi.mock("../../../utils/constants", () => ({
  PAGES: {
    successBanner: "successBanner",
  },
}));

describe("NoticeFactory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ lang: "en" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Structure", () => {
    it("renders GcdsNotice with correct default attributes", () => {
      render(<NoticeFactory noticeType="mfaDeleted" />);
      const notice = screen.getByTestId("gcds-notice");
      expect(notice).toHaveAttribute("data-type", "success");
      expect(notice).toHaveAttribute("data-notice-title-tag", "h2");
      expect(notice).toHaveAttribute("data-notice-title", " ");
    });

    it("renders with mfaAdded noticeType", () => {
      render(<NoticeFactory noticeType="mfaAdded" />);
      const notice = screen.getByTestId("gcds-notice");
      expect(notice).toHaveAttribute("data-type", "success");
    });
  });

  describe("Notice Type: mfaDeleted", () => {
    it("displays the correct message for mfaDeleted with phone number", () => {
      const phoneNumber = "+1 (555) 123-4567";
      render(
        <NoticeFactory noticeType="mfaDeleted" phoneNumber={phoneNumber} />,
      );

      // Verify the component renders and includes the phone number
      expect(screen.getByTestId("gcds-notice")).toBeInTheDocument();
      expect(screen.getByText(phoneNumber)).toBeInTheDocument();
    });

    it("displays correct title for mfaDeleted", () => {
      render(<NoticeFactory noticeType="mfaDeleted" />);
      const notice = screen.getByTestId("gcds-notice");
      expect(notice).toHaveAttribute("data-notice-title", " ");
    });
  });

  describe("Notice Type: mfaAdded", () => {
    it("displays the correct message for mfaAdded with SMS", () => {
      const phoneNumber = "+1 (555) 123-4567";
      render(
        <NoticeFactory
          noticeType="mfaAdded"
          phoneNumber={phoneNumber}
          otpType="sms"
        />,
      );

      // Verify the component renders and includes the phone number
      expect(screen.getByTestId("gcds-notice")).toBeInTheDocument();
      expect(screen.getByText(phoneNumber)).toBeInTheDocument();
    });

    it("displays the correct message for mfaAdded with Voice", () => {
      const phoneNumber = "+1 (555) 123-4567";
      render(
        <NoticeFactory
          noticeType="mfaAdded"
          phoneNumber={phoneNumber}
          otpType="voice"
        />,
      );

      // Verify the component renders and includes the phone number
      expect(screen.getByTestId("gcds-notice")).toBeInTheDocument();
      expect(screen.getByText(phoneNumber)).toBeInTheDocument();
    });

    it("displays correct title for mfaAdded", () => {
      render(<NoticeFactory noticeType="mfaAdded" />);
      const notice = screen.getByTestId("gcds-notice");
      expect(notice).toHaveAttribute("data-notice-title", " ");
    });
  });

  describe("Language Support", () => {
    it("works with French language parameter", () => {
      mockUseParams.mockReturnValue({ lang: "fr" });
      render(<NoticeFactory noticeType="mfaDeleted" />);

      expect(screen.getByTestId("gcds-notice")).toBeInTheDocument();
    });

    it("works with undefined language parameter", () => {
      mockUseParams.mockReturnValue({});
      render(<NoticeFactory noticeType="mfaDeleted" />);

      expect(screen.getByTestId("gcds-notice")).toBeInTheDocument();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("returns null for undefined noticeType", () => {
      const { container } = render(<NoticeFactory noticeType={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null for null noticeType", () => {
      const { container } = render(<NoticeFactory noticeType={null} />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null for empty noticeType", () => {
      const { container } = render(<NoticeFactory noticeType="" />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null for invalid noticeType", () => {
      const { container } = render(<NoticeFactory noticeType="invalidType" />);
      expect(container.firstChild).toBeNull();
    });
    it("handles empty phoneNumber gracefully", () => {
      render(<NoticeFactory noticeType="mfaDeleted" phoneNumber="" />);

      expect(screen.getByTestId("gcds-notice")).toBeInTheDocument();
    });

    it("handles null phoneNumber gracefully", () => {
      render(<NoticeFactory noticeType="mfaDeleted" phoneNumber={null} />);

      expect(screen.getByTestId("gcds-notice")).toBeInTheDocument();
    });

    it("handles undefined otpType gracefully", () => {
      render(
        <NoticeFactory
          noticeType="mfaAdded"
          phoneNumber="+1 (555) 123-4567"
          otpType={undefined}
        />,
      );
      expect(screen.getByTestId("gcds-notice")).toBeInTheDocument();
    });

    it("handles empty string otpType gracefully", () => {
      render(
        <NoticeFactory
          noticeType="mfaAdded"
          phoneNumber="+1 (555) 123-4567"
          otpType=""
        />,
      );
      expect(screen.getByTestId("gcds-notice")).toBeInTheDocument();
    });

    it("handles invalid otpType gracefully", () => {
      render(
        <NoticeFactory
          noticeType="mfaAdded"
          phoneNumber="+1 (555) 123-4567"
          otpType="invalidType"
        />,
      );
      expect(screen.getByTestId("gcds-notice")).toBeInTheDocument();
    });
  });
});
