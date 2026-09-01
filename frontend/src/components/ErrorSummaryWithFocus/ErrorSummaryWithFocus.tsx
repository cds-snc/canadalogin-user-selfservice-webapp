import { GcdsErrorSummary } from "@gcds-core/components-react";
import { useEffect } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { useTranslation } from "react-i18next";

const FOCUSABLE_SELECTOR =
  "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1']), [contenteditable='true']";

const isNaturallyFocusable = (element: HTMLElement): boolean =>
  element.matches(
    "a[href], button, input, select, textarea, [contenteditable='true']",
  );

const getFocusableElement = (element: HTMLElement): HTMLElement => {
  const shadowFocusable =
    element.shadowRoot?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
  if (shadowFocusable) {
    return shadowFocusable;
  }

  const nestedFocusable =
    element.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
  if (nestedFocusable) {
    return nestedFocusable;
  }

  return element;
};

const focusElement = (
  element: HTMLElement,
  options?: { preferDescendant?: boolean },
): void => {
  const elementToFocus = options?.preferDescendant
    ? getFocusableElement(element)
    : element;
  const existingTabIndex = elementToFocus.getAttribute("tabindex");
  const shouldAddTemporaryTabIndex =
    !isNaturallyFocusable(elementToFocus) && existingTabIndex === null;

  if (shouldAddTemporaryTabIndex) {
    elementToFocus.setAttribute("tabindex", "-1");
  }

  elementToFocus.focus();

  if (shouldAddTemporaryTabIndex) {
    elementToFocus.addEventListener(
      "blur",
      () => elementToFocus.removeAttribute("tabindex"),
      { once: true },
    );
  }
};

const scrollElementIntoView = (element: HTMLElement): void => {
  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  element.scrollIntoView?.({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
};

const extractHashFromHref = (href: string): string | null => {
  if (!href) {
    return null;
  }

  if (href.startsWith("#")) {
    return href;
  }

  try {
    return new URL(href, window.location.href).hash || null;
  } catch {
    return null;
  }
};

const getHashFromEvent = (event: Event): string | null => {
  const customEvent = event as CustomEvent<unknown>;
  if (typeof customEvent.detail === "string") {
    const detailHash = extractHashFromHref(customEvent.detail);
    if (detailHash) {
      return detailHash;
    }
  }

  if (event.target instanceof HTMLAnchorElement) {
    return extractHashFromHref(event.target.getAttribute("href") || "");
  }

  const eventPath =
    typeof event.composedPath === "function" ? event.composedPath() : [];
  for (const pathElement of eventPath) {
    if (pathElement instanceof HTMLAnchorElement) {
      return extractHashFromHref(pathElement.getAttribute("href") || "");
    }
  }

  return null;
};

const getElementIdFromHash = (hash: string): string => {
  const rawId = hash.startsWith("#") ? hash.slice(1) : hash;

  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
};

const focusErrorLinkTarget = (hash: string, summaryId: string): void => {
  const elementId = getElementIdFromHash(hash);
  if (!elementId) {
    focusErrorSummary(summaryId);
    return;
  }

  const targetElement = document.getElementById(
    elementId,
  ) as HTMLElement | null;
  if (!targetElement) {
    focusErrorSummary(summaryId);
    return;
  }

  scrollElementIntoView(targetElement);
  focusElement(targetElement, { preferDescendant: true });
};

const focusErrorSummary = (summaryId: string): void => {
  const summaryElement = document.getElementById(
    summaryId,
  ) as HTMLElement | null;

  if (!summaryElement) {
    return;
  }

  scrollElementIntoView(summaryElement);
  focusElement(summaryElement);
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

  useEffect(() => {
    const summaryElement = document.getElementById(id);
    if (!summaryElement) {
      return;
    }

    const handleErrorSummaryLinkClick = (event: Event) => {
      const targetHash = getHashFromEvent(event);
      if (!targetHash || !targetHash.startsWith("#")) {
        return;
      }

      event.preventDefault();
      focusErrorLinkTarget(targetHash, id);
    };

    summaryElement.addEventListener("click", handleErrorSummaryLinkClick);
    summaryElement.addEventListener(
      "gcdsClick",
      handleErrorSummaryLinkClick as EventListener,
    );

    return () => {
      summaryElement.removeEventListener("click", handleErrorSummaryLinkClick);
      summaryElement.removeEventListener(
        "gcdsClick",
        handleErrorSummaryLinkClick as EventListener,
      );
    };
  }, [id, errorMessage]);

  if (!errorMessage) {
    return null;
  }

  const defaultErrorLinks = {
    [`#${id}`]: errorMessage,
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
