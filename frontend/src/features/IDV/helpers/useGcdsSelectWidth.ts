import { useEffect } from "react";

export default function useGcdsSelectWidth(
  selectElementIds: readonly string[],
): void {
  const selectElementIdsKey = selectElementIds.join(",");

  useEffect(() => {
    const applySelectShadowWidth = () => {
      selectElementIds.forEach((elementId) => {
        const element = document.getElementById(elementId) as HTMLElement | null;

        if (!element) {
          return;
        }

        const shadowRoot = element.shadowRoot;

        if (!shadowRoot) {
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
        }
      });
    };

    applySelectShadowWidth();
  }, [selectElementIdsKey]);
}