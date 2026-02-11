import { GcdsErrorSummary } from "@cdssnc/gcds-components-react";
import { useEffect, useRef } from "react";
import { getPageContent } from "../../utils/functions";
import { PAGES } from "../../utils/constants";

interface ErrorSummaryWithFocusProps {
  errorCode: string;
  language: string;
  id?: string;
  errorLinks?: Record<string, string>;
  autoFocus?: boolean;
  [key: string]: unknown;
}

/**
 * A reusable error summary component that automatically scrolls to and focuses
 * the error when rendered. This ensures consistent accessibility behavior across
 * all pages that display error summaries.
 *
 * @param {Object} props - The component props
 * @param {string} props.errorCode - The error code to look up the message
 * @param {string} props.language - The current language (en/fr)
 * @param {string} [props.id="errorSummary"] - The ID for the error summary element
 * @param {Object} [props.errorLinks] - Custom error links object (optional)
 * @param {boolean} [props.autoFocus=true] - Whether to auto-scroll and focus (default: true)
 * @param {Object} [props.otherProps] - Any other props to pass to GcdsErrorSummary
 */
export default function ErrorSummaryWithFocus({
  errorCode,
  language,
  id = "errorSummary",
  errorLinks,
  autoFocus = true,
  ...otherProps
}: ErrorSummaryWithFocusProps) {
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  // Get error page content internally
  const errorPageJson = getPageContent(language, PAGES.error) || {};

  const errorMessage = errorCode
    ? (errorPageJson[errorCode] as string) ||
      (errorPageJson["7"] as string) ||
      ""
    : "";

  // Effect to scroll to and focus error summary when error message changes
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (errorMessage && errorSummaryRef.current && autoFocus) {
      // Small delay to ensure the component is fully rendered
      timeoutId = setTimeout(() => {
        // Check if ref is still available (component not unmounted)
        if (errorSummaryRef.current) {
          // Scroll the error summary into view
          errorSummaryRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });

          // Focus the error summary for accessibility
          errorSummaryRef.current.focus();
        }
      }, 100);
    }

    // Cleanup function to clear timeout
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [errorMessage, autoFocus]);

  // Don't render if there's no error message
  if (!errorMessage) {
    return null;
  }

  // Default error links structure if not provided
  const defaultErrorLinks = {
    "#error-href-1": errorMessage,
  };

  return (
    <GcdsErrorSummary
      ref={errorSummaryRef}
      id={id}
      errorLinks={errorLinks || defaultErrorLinks}
      heading={errorPageJson[1]}
      lang={language}
      {...otherProps}
    />
  );
}
