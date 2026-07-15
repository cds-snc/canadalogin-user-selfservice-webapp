export type ShadowStyleRule = {
  hosts: readonly string[];
  css: string;
};

export type PrintOptions = {
  hideHosts: readonly string[];
  shadowStyles: readonly ShadowStyleRule[];
  printTitle?: string;
  printCss?: string;
};

const PRINT_PREVIOUS_DISPLAY_ATTRIBUTE = "data-print-prev-display";

const hideHosts = (selectors: readonly string[]) => {
  if (selectors.length === 0) {
    return () => {};
  }

  const hosts = document.querySelectorAll<HTMLElement>(selectors.join(","));

  hosts.forEach((host) => {
    host.setAttribute(PRINT_PREVIOUS_DISPLAY_ATTRIBUTE, host.style.display);
    host.style.display = "none";
  });

  return () => {
    hosts.forEach((host) => {
      const previousDisplay =
        host.getAttribute(PRINT_PREVIOUS_DISPLAY_ATTRIBUTE) ?? "";

      host.style.display = previousDisplay;
      host.removeAttribute(PRINT_PREVIOUS_DISPLAY_ATTRIBUTE);
    });
  };
};

const injectShadowStyles = (rules: readonly ShadowStyleRule[]) => {
  const cleanupCallbacks: Array<() => void> = [];

  rules.forEach(({ hosts, css }) => {
    if (hosts.length === 0) {
      return;
    }

    const matchingHosts = document.querySelectorAll<HTMLElement>(
      hosts.join(","),
    );

    matchingHosts.forEach((host) => {
      const root = host.shadowRoot;

      if (!root) {
        return;
      }

      const styleElement = document.createElement("style");
      styleElement.textContent = css;
      root.appendChild(styleElement);

      cleanupCallbacks.push(() => {
        styleElement.remove();
      });
    });
  });

  return () => {
    cleanupCallbacks.forEach((cleanup) => cleanup());
  };
};

const overridePrintTitle = (title?: string) => {
  if (title === undefined) {
    return () => {};
  }

  const previousTitle = document.title;
  document.title = title;

  return () => {
    document.title = previousTitle;
  };
};

const injectPrintCss = (css?: string) => {
  if (!css) {
    return () => {};
  }

  const styleElement = document.createElement("style");
  styleElement.textContent = css;
  document.head.appendChild(styleElement);

  return () => {
    styleElement.remove();
  };
};

export default function printWithShadowDomStyles(options: PrintOptions): void {
  const restoreHosts = hideHosts(options.hideHosts);
  const restoreShadowStyles = injectShadowStyles(options.shadowStyles);
  const restorePrintTitle = overridePrintTitle(options.printTitle);
  const restorePrintCss = injectPrintCss(options.printCss);

  let didCleanup = false;

  const cleanup = () => {
    if (didCleanup) {
      return;
    }

    didCleanup = true;
    window.removeEventListener("afterprint", cleanup);
    restorePrintCss();
    restorePrintTitle();
    restoreShadowStyles();
    restoreHosts();
  };

  window.addEventListener("afterprint", cleanup, { once: true });

  if (typeof window.print !== "function") {
    cleanup();
    return;
  }

  try {
    window.print();
  } catch (error) {
    cleanup();
    throw error;
  }
}
