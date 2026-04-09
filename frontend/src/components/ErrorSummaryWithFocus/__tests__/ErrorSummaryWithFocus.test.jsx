import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BrowserRouter } from "react-router";
import ErrorSummaryWithFocus from "../ErrorSummaryWithFocus";
import "@testing-library/jest-dom/vitest";
import i18n from "../../../i18n/test";

// Mock GCDS components to enable proper event handling and testing
vi.mock("@gcds-core/components-react", () => ({
  GcdsErrorSummary: ({
    children,
    id,
    errorLinks,
    heading,
    lang,
    className,
    ...otherProps
  }) => (
    <div
      id={id}
      className={className}
      data-testid="gcds-error-summary"
      data-heading={heading}
      data-lang={lang}
      tabIndex="-1"
      {...otherProps}
    >
      <h2 data-testid="error-summary-heading">{heading}</h2>
      <ul data-testid="error-summary-links">
        {Object.entries(errorLinks || {}).map(([href, text], index) => (
          <li key={index}>
            <a href={href} data-testid={`error-link-${index}`}>
              {text}
            </a>
          </li>
        ))}
      </ul>
      {children}
    </div>
  ),
}));

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe("ErrorSummaryWithFocus Unit Tests", () => {
  // Mock DOM methods
  const mockScrollIntoView = vi.fn();
  const mockFocus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    // Mock DOM methods
    Element.prototype.scrollIntoView = mockScrollIntoView;
    HTMLElement.prototype.focus = mockFocus;
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });
  describe("Component Rendering", () => {
    it("should render the component without crashing when errorCode is provided", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0011E" language="en" />
        </TestWrapper>,
      );

      expect(screen.getByTestId("gcds-error-summary")).toBeInTheDocument();
      expect(screen.getByTestId("error-summary-heading")).toBeInTheDocument();
      expect(screen.getByTestId("error-summary-links")).toBeInTheDocument();
    });

    it("should not render when errorCode is not provided", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus language="en" />
        </TestWrapper>,
      );

      expect(
        screen.queryByTestId("gcds-error-summary"),
      ).not.toBeInTheDocument();
    });

    it("should not render when errorCode is empty string", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="" language="en" />
        </TestWrapper>,
      );

      expect(
        screen.queryByTestId("gcds-error-summary"),
      ).not.toBeInTheDocument();
    });

    it("should render with default id when not provided", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0011E" language="en" />
        </TestWrapper>,
      );

      const errorSummary = screen.getByTestId("gcds-error-summary");
      expect(errorSummary).toHaveAttribute("id", "errorSummary");
    });

    it("should render with custom id when provided", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus
            errorCode="CSIAM0011E"
            language="en"
            id="customErrorId"
          />
        </TestWrapper>,
      );

      const errorSummary = screen.getByTestId("gcds-error-summary");
      expect(errorSummary).toHaveAttribute("id", "customErrorId");
    });
  });

  describe("Error Message Handling", () => {
    it("should display correct error message for known error code", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0011E" language="en" />
        </TestWrapper>,
      );

      expect(
        screen.getByText("The verification code is invalid or has expired."),
      ).toBeInTheDocument();
    });

    it("should display default error message for unknown error code", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="UNKNOWN_ERROR" language="en" />
        </TestWrapper>,
      );

      expect(
        screen.getByText("Server Error. Please try again later."),
      ).toBeInTheDocument();
    });

    it("should display correct heading in English", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0011E" language="en" />
        </TestWrapper>,
      );

      expect(screen.getByText("There was a problem")).toBeInTheDocument();
    });

    it("should display error message with correct language attribute", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0011E" language="en" />
        </TestWrapper>,
      );

      const errorSummary = screen.getByTestId("gcds-error-summary");
      expect(errorSummary).toHaveAttribute("data-lang", "en");
    });
  });

  describe("French Language Support", () => {
    beforeEach(() => {
      i18n.changeLanguage("fr");
    });

    afterEach(() => {
      i18n.changeLanguage("en");
    });

    it("should render French content when language is 'fr'", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0011E" language="fr" />
        </TestWrapper>,
      );

      expect(
        screen.getByText(
          "Le code de vérification n'est pas valide ou a expiré.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("Un problème est survenu")).toBeInTheDocument();
    });

    it("should display French default error message for unknown error code", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="UNKNOWN_ERROR" language="fr" />
        </TestWrapper>,
      );

      expect(
        screen.getByText(
          "Une erreur du serveur s'est produite. Veuillez réessayer plus tard.",
        ),
      ).toBeInTheDocument();
    });

    it("should have correct French language attribute", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0011E" language="fr" />
        </TestWrapper>,
      );

      const errorSummary = screen.getByTestId("gcds-error-summary");
      expect(errorSummary).toHaveAttribute("data-lang", "fr");
    });
  });

  describe("Error Links Functionality", () => {
    it("should use default error links when not provided", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0011E" language="en" />
        </TestWrapper>,
      );

      const link = screen.getByTestId("error-link-0");
      expect(link).toHaveAttribute("href", "#error-href-1");
      expect(link).toHaveTextContent(
        "The verification code is invalid or has expired.",
      );
    });

    it("should use custom error links when provided", () => {
      const customErrorLinks = {
        "#custom-error-1": "Custom error message 1",
        "#custom-error-2": "Custom error message 2",
      };

      render(
        <TestWrapper>
          <ErrorSummaryWithFocus
            errorCode="CSIAM0011E"
            language="en"
            errorLinks={customErrorLinks}
          />
        </TestWrapper>,
      );

      expect(screen.getByText("Custom error message 1")).toBeInTheDocument();
      expect(screen.getByText("Custom error message 2")).toBeInTheDocument();

      const link1 = screen.getByTestId("error-link-0");
      const link2 = screen.getByTestId("error-link-1");

      expect(link1).toHaveAttribute("href", "#custom-error-1");
      expect(link2).toHaveAttribute("href", "#custom-error-2");
    });

    it("should handle empty error links object", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus
            errorCode="CSIAM0011E"
            language="en"
            errorLinks={{}}
          />
        </TestWrapper>,
      );

      const errorSummary = screen.getByTestId("gcds-error-summary");
      expect(errorSummary).toBeInTheDocument();
      expect(screen.queryByTestId("error-link-0")).not.toBeInTheDocument();
    });
  });

  describe("Auto-focus and Scrolling Behavior", () => {
    it("should auto-scroll and focus when autoFocus is true (default)", async () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0011E" language="en" />
        </TestWrapper>,
      );

      // Fast-forward timers to trigger the setTimeout
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
      expect(mockFocus).toHaveBeenCalled();
    });

    it("should not auto-scroll and focus when autoFocus is false", async () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus
            errorCode="CSIAM0011E"
            language="en"
            autoFocus={false}
          />
        </TestWrapper>,
      );

      // Fast-forward timers to trigger any potential setTimeout
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      expect(mockScrollIntoView).not.toHaveBeenCalled();
      expect(mockFocus).not.toHaveBeenCalled();
    });

    it("should trigger scroll and focus when error message changes", async () => {
      const { rerender } = render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0010E" language="en" />
        </TestWrapper>,
      );

      // Clear mock calls from initial render
      mockScrollIntoView.mockClear();
      mockFocus.mockClear();

      // Change error code
      rerender(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0038E" language="en" />
        </TestWrapper>,
      );

      // Fast-forward timers
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
      expect(mockFocus).toHaveBeenCalled();
    });

    it("should not trigger scroll and focus if error message is empty", async () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="" language="en" />
        </TestWrapper>,
      );

      // Fast-forward timers
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      expect(mockScrollIntoView).not.toHaveBeenCalled();
      expect(mockFocus).not.toHaveBeenCalled();
    });
  });

  describe("Additional Props Handling", () => {
    it("should pass additional props to GcdsErrorSummary", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus
            errorCode="CSIAM0011E"
            language="en"
            className="custom-class"
            data-custom="custom-value"
          />
        </TestWrapper>,
      );

      const errorSummary = screen.getByTestId("gcds-error-summary");
      expect(errorSummary).toHaveClass("custom-class");
      expect(errorSummary).toHaveAttribute("data-custom", "custom-value");
    });

    it("should handle multiple additional props", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus
            errorCode="CSIAM0011E"
            language="en"
            role="alert"
            aria-label="Error summary"
            style={{ marginTop: "20px" }}
          />
        </TestWrapper>,
      );

      const errorSummary = screen.getByTestId("gcds-error-summary");
      expect(errorSummary).toHaveAttribute("role", "alert");
      expect(errorSummary).toHaveAttribute("aria-label", "Error summary");
      expect(errorSummary).toHaveAttribute("style", "margin-top: 20px;");
    });
  });

  describe("Different Error Codes", () => {
    const errorCodes = [
      {
        code: "CSIAM0010E",
        expectedMessage: "The authentication attempt failed",
      },
      { code: "CSIAM0038E", expectedMessage: "Too Many Attempts" },
      {
        code: "CSIAI0021E",
        expectedMessage:
          "The password that you specified was used previously, and it cannot be reused.",
      },
    ];

    errorCodes.forEach(({ code, expectedMessage }) => {
      it(`should display correct message for error code ${code}`, () => {
        render(
          <TestWrapper>
            <ErrorSummaryWithFocus errorCode={code} language="en" />
          </TestWrapper>,
        );

        expect(screen.getByText(expectedMessage)).toBeInTheDocument();
      });
    });
  });

  describe("Component Re-rendering", () => {
    it("should handle error code changes properly", () => {
      const { rerender } = render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0010E" language="en" />
        </TestWrapper>,
      );

      expect(
        screen.getByText("The authentication attempt failed"),
      ).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0038E" language="en" />
        </TestWrapper>,
      );

      expect(
        screen.queryByText("The authentication attempt failed"),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Too Many Attempts")).toBeInTheDocument();
    });

    it("should handle language changes properly", () => {
      const { rerender } = render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0010E" language="en" />
        </TestWrapper>,
      );

      expect(
        screen.getByText("The authentication attempt failed"),
      ).toBeInTheDocument();

      i18n.changeLanguage("fr");
      rerender(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0010E" language="fr" />
        </TestWrapper>,
      );

      expect(
        screen.queryByText("The authentication attempt failed"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText("La tentative d'authentification a échoué"),
      ).toBeInTheDocument();
      i18n.changeLanguage("en");
    });

    it("should unmount gracefully when error is cleared", async () => {
      const { rerender } = render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0010E" language="en" />
        </TestWrapper>,
      );

      expect(screen.getByTestId("gcds-error-summary")).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="" language="en" />
        </TestWrapper>,
      );

      expect(
        screen.queryByTestId("gcds-error-summary"),
      ).not.toBeInTheDocument();

      // Fast-forward timers to ensure any pending setTimeout calls are handled
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle null errorCode gracefully", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode={null} language="en" />
        </TestWrapper>,
      );

      expect(
        screen.queryByTestId("gcds-error-summary"),
      ).not.toBeInTheDocument();
    });

    it("should handle undefined errorCode gracefully", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode={undefined} language="en" />
        </TestWrapper>,
      );

      expect(
        screen.queryByTestId("gcds-error-summary"),
      ).not.toBeInTheDocument();
    });

    it("should handle missing language parameter", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0011E" />
        </TestWrapper>,
      );

      // Should still render with undefined language (getPageContent will handle this)
      expect(screen.getByTestId("gcds-error-summary")).toBeInTheDocument();
    });

    it("should handle very long error messages", () => {
      const longErrorCode = "A".repeat(1000);

      render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode={longErrorCode} language="en" />
        </TestWrapper>,
      );

      // Should fall back to default error message
      expect(
        screen.getByText("Server Error. Please try again later."),
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper tabindex for keyboard navigation", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0011E" language="en" />
        </TestWrapper>,
      );

      const errorSummary = screen.getByTestId("gcds-error-summary");
      expect(errorSummary).toHaveAttribute("tabIndex", "-1");
    });

    it("should maintain focus management when error changes", async () => {
      const { rerender } = render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0010E" language="en" />
        </TestWrapper>,
      );

      // Clear initial focus calls
      mockFocus.mockClear();

      rerender(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0038E" language="en" />
        </TestWrapper>,
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockFocus).toHaveBeenCalled();
    });

    it("should provide proper heading structure", () => {
      render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0011E" language="en" />
        </TestWrapper>,
      );

      const heading = screen.getByTestId("error-summary-heading");
      expect(heading.tagName).toBe("H2");
    });
  });

  describe("Performance Considerations", () => {
    it("should handle rapid error code changes without issues", async () => {
      const { rerender } = render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0010E" language="en" />
        </TestWrapper>,
      );

      // Rapidly change error codes
      const errorCodes = ["CSIAM0038E", "CSIAM0011E", "CSIAI0021E"];

      errorCodes.forEach((code) => {
        rerender(
          <TestWrapper>
            <ErrorSummaryWithFocus errorCode={code} language="en" />
          </TestWrapper>,
        );
      });

      // Should still render the last error code
      expect(
        screen.getByText(
          "The password that you specified was used previously, and it cannot be reused.",
        ),
      ).toBeInTheDocument();
    });

    it("should cleanup timers properly on unmount", () => {
      const { unmount } = render(
        <TestWrapper>
          <ErrorSummaryWithFocus errorCode="CSIAM0011E" language="en" />
        </TestWrapper>,
      );

      unmount();

      // Advance timers after unmount - should not cause issues
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // No assertions needed - test passes if no errors thrown
    });
  });
});
