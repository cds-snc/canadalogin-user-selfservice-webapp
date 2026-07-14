import { GcdsErrorSummary } from "@gcds-core/components-react";
import { useEffect } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { useTranslation } from "react-i18next";

export const focusErrorSummary = (summaryId: string): void => {
  const summaryElement = document.getElementById(
    summaryId,
  ) as HTMLElement | null;

  if (!summaryElement) {
    return;
  }

  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  summaryElement.scrollIntoView?.({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });

  summaryElement.setAttribute("tabindex", "-1");
  summaryElement.focus();

  summaryElement.addEventListener(
    "blur",
    () => summaryElement.removeAttribute("tabindex"),
    { once: true },
  );
};

type GcdsErrorSummaryProps = ComponentPropsWithoutRef<typeof GcdsErrorSummary>;

interface ErrorSummaryWithFocusProps extends Omit<
  GcdsErrorSummaryProps,
  "errorLinks" | "heading" | "id" | "lang"
> {
  errorCode?: string | null;
  errorMessage?: string;
  language?: string;
  id?: string;
  errorLinks?: Record<string, string>;
  autoFocus?: boolean;
}

export default function ErrorSummaryWithFocus({
  errorCode,
  errorMessage: errorMessageProp,
  language,
  id = "errorSummary",
  errorLinks,
  autoFocus = true,
  ...otherProps
}: ErrorSummaryWithFocusProps) {
  const { t } = useTranslation("common");

  const errorMessage =
    errorMessageProp ||
    (errorCode
      ? t(`Error.${errorCode}`, { defaultValue: t("Error.serverError") })
      : "");

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (errorMessage && autoFocus) {
      timeoutId = setTimeout(() => {
        focusErrorSummary(id);
      }, 100);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [errorMessage, autoFocus, id]);

  if (!errorMessage) {
    return null;
  }

  // This could be removed ?
  const defaultErrorLinks = {
    "#error-href-1": errorMessage,
  };

  return (
    <GcdsErrorSummary
      id={id}
      errorLinks={errorLinks || defaultErrorLinks}
      heading={t("Error.genericProblem")}
      lang={language}
      {...otherProps}
    />
  );
}
