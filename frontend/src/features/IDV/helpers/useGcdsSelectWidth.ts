import { useEffect } from "react";

export default function useGcdsSelectWidth(
  selectElementIds: readonly string[],
): void {
  useEffect(() => {
    const RETRY_DELAY_MS = 50;

    const applySelectShadowWidth = (): boolean => {
      let allElementsUpdated = true;

      selectElementIds.forEach((elementId) => {
        const element = document.getElementById(
          elementId,
        ) as HTMLElement | null;

        if (!element) {
          allElementsUpdated = false;
          return;
        }

        const shadowRoot = element.shadowRoot;

        if (!shadowRoot) {
          allElementsUpdated = false;
          return;
        }

        const wrapper = shadowRoot.querySelector(
          ".gcds-select__wrapper",
        ) as HTMLElement | null;

        if (wrapper) {
          // This follows GC Design System guidance for input/select width handling.
          wrapper.style.maxWidth = "75ch";
        }

        // Styles must be applied directly to the internal select in the web component shadow DOM.
        const internalSelect = shadowRoot.querySelector(
          "select",
        ) as HTMLSelectElement | null;

        if (internalSelect) {
          internalSelect.style.width = "100%";
        } else {
          allElementsUpdated = false;
        }
      });

      return allElementsUpdated;
    };

    const wasUpdatedImmediately = applySelectShadowWidth();
    let retryTimeoutId: number | undefined;

    if (!wasUpdatedImmediately) {
      // Back-navigation can restore the page before custom elements fully hydrate.
      retryTimeoutId = window.setTimeout(() => {
        applySelectShadowWidth();
      }, RETRY_DELAY_MS);
    }

    return () => {
      if (retryTimeoutId !== undefined) {
        window.clearTimeout(retryTimeoutId);
      }
    };
  }, [selectElementIds]);
}
