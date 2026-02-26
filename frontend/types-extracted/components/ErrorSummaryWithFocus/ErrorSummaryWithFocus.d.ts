/**
 * A reusable error summary component that automatically scrolls to and focuses
 * the error when rendered. This ensures consistent accessibility behavior across
 * all pages that display error summaries.
 *
 * @param {Object} props - The component props
 * @param {string} props.errorMessage - The error message to display
 * @param {string} props.language - The current language (en/fr)
 * @param {string} [props.id="errorSummary"] - The ID for the error summary element
 * @param {Object} [props.errorLinks] - Custom error links object (optional)
 * @param {boolean} [props.autoFocus=true] - Whether to auto-scroll and focus (default: true)
 * @param {Object} [props.otherProps] - Any other props to pass to GcdsErrorSummary
 */
export default function ErrorSummaryWithFocus({ errorCode, language, id, errorLinks, autoFocus, ...otherProps }: {
    errorMessage: string;
    language: string;
    id?: string;
    errorLinks?: any;
    autoFocus?: boolean;
    otherProps?: any;
}): import("react/jsx-runtime").JSX.Element;
