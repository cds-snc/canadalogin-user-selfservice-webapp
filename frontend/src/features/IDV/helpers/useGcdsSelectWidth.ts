import { useEffect } from "react";

export default function useGcdsSelectWidth(selectIds: string[]): void {
  useEffect(() => {
    const getSelectElements = (): HTMLElement[] => {
      const selectElements = new Set<HTMLElement>();

      selectIds.forEach((selectId) => {
        const elements = document.querySelectorAll(
          `gcds-select#${selectId}, gcds-select[select-id=\"${selectId}\"]`,
        );

        elements.forEach((element) => {
          selectElements.add(element as HTMLElement);
        });
      });

      return Array.from(selectElements);
    };

    const applySelectShadowWidth = () => {
      const selects = getSelectElements();

      selects.forEach((element) => {
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

    if (!selectIds.length) {
      return;
    }

    applySelectShadowWidth();

    const observer = new MutationObserver(() => {
      applySelectShadowWidth();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [selectIds]);
}
