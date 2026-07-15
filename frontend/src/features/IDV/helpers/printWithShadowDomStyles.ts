export type ShadowStyleRule = {
  hosts: readonly string[];
  css: string;
};

export type PrintOptions = {
  hideHosts: readonly string[];
  shadowStyles: readonly ShadowStyleRule[];
};

const hideHosts = (hostSelectors: readonly string[]) => {
  if (hostSelectors.length === 0) {
    return () => {};
  }

  const previousDisplayByHost = new WeakMap<HTMLElement, string>();
  const matchedHosts = document.querySelectorAll<HTMLElement>(
    hostSelectors.join(","),
  );

  matchedHosts.forEach((host) => {
    previousDisplayByHost.set(host, host.style.display);
    host.style.display = "none";
  });

  return () => {
    matchedHosts.forEach((host) => {
      host.style.display = previousDisplayByHost.get(host) ?? "";
    });
  };
};

const injectShadowStyles = (rules: readonly ShadowStyleRule[]) => {
  const cleanupCallbacks: Array<() => void> = [];

  rules.forEach(({ hosts, css }) => {
    if (hosts.length === 0) {
      return;
    }

    const matchedHosts = document.querySelectorAll<HTMLElement>(
      hosts.join(","),
    );

    matchedHosts.forEach((host) => {
      const root = host.shadowRoot;

      if (!root) {
        return;
      }

      // Scope transient print styles to this shadow root only.
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

export default function printWithShadowDomStyles(options: PrintOptions): void {
  const restoreHosts = hideHosts(options.hideHosts);
  const restoreShadowStyles = injectShadowStyles(options.shadowStyles);

  let didCleanup = false;
  const focusCleanup = () => cleanup();
  const printMediaQueryList =
    typeof window.matchMedia === "function" ? window.matchMedia("print") : null;
  const mediaQueryCleanup = (event: MediaQueryListEvent) => {
    if (!event.matches) {
      cleanup();
    }
  };

  function cleanup() {
    if (didCleanup) {
      return;
    }

    // Guard cleanup so it runs once regardless of which completion signal fires.
    didCleanup = true;
    window.removeEventListener("afterprint", cleanup);
    window.removeEventListener("focus", focusCleanup);

    if (printMediaQueryList) {
      if (typeof printMediaQueryList.removeEventListener === "function") {
        printMediaQueryList.removeEventListener("change", mediaQueryCleanup);
      } else {
        printMediaQueryList.removeListener(mediaQueryCleanup);
      }
    }

    restoreShadowStyles();
    restoreHosts();
  }

  window.addEventListener("afterprint", cleanup, { once: true });
  window.addEventListener("focus", focusCleanup, { once: true });

  if (printMediaQueryList) {
    if (typeof printMediaQueryList.addEventListener === "function") {
      printMediaQueryList.addEventListener("change", mediaQueryCleanup);
    } else {
      printMediaQueryList.addListener(mediaQueryCleanup);
    }
  }

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
