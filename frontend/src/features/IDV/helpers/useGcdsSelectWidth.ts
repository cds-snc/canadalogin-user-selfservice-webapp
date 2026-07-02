import { useEffect } from "react";

export default function useGcdsSelectWidth(
  selector = "gcds-select.visit-canada-post-select",
): void {
  useEffect(() => {
    const applySelectShadowWidth = () => {
      const selects = document.querySelectorAll(selector);

      selects.forEach((element) => {
        const shadowRoot = (element as HTMLElement).shadowRoot;

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
  }, [selector]);
}
