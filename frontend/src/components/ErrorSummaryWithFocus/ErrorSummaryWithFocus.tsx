import { GcdsErrorSummary } from "@gcds-core/components-react";
import { useEffect, useRef } from "react";
import type { ComponentPropsWithoutRef, ComponentRef } from "react";
import { useTranslation } from "react-i18next";

type GcdsErrorSummaryProps = ComponentPropsWithoutRef<typeof GcdsErrorSummary>;

interface ErrorSummaryWithFocusProps
  extends Omit<
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
  const errorSummaryRef = useRef<ComponentRef<typeof GcdsErrorSummary>>(null);

  const { t } = useTranslation("common");

  const errorMessage =
    errorMessageProp ||
    (errorCode
      ? t(`Error.${errorCode}`, { defaultValue: t("Error.serverError") })
      : "");

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (errorMessage && errorSummaryRef.current && autoFocus) {
      timeoutId = setTimeout(() => {
        if (errorSummaryRef.current) {
          errorSummaryRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });

          errorSummaryRef.current.focus();
        }
      }, 100);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [errorMessage, autoFocus]);

  if (!errorMessage) {
    return null;
  }

  const defaultErrorLinks = {
    "#error-href-1": errorMessage,
  };

  return (
    <GcdsErrorSummary
      ref={errorSummaryRef}
      id={id}
      errorLinks={errorLinks || defaultErrorLinks}
      heading={t("Error.genericProblem")}
      lang={language}
      {...otherProps}
    />
  );
}
