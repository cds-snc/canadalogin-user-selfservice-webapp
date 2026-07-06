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
};
