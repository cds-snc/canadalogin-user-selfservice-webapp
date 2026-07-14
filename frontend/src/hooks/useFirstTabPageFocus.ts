import { useCallback, useEffect, useRef } from "react";

// Matches elements that participate in normal keyboard navigation.
const FOCUSABLE_SELECTOR =
  'a[href], button, input, select, textarea, [contenteditable="true"], [tabindex]:not([tabindex="-1"])';

// Priority order for where focus should land at the top of a page/view.
// Pages can opt in to a custom first target via data-page-focus-target.
const PAGE_TOP_FOCUS_TARGET_SELECTORS = [
  "[data-page-focus-target]",
  'gcds-heading[tag="h1"]',
  "h1",
  '[role="heading"][aria-level="1"]',
  "gcds-heading",
  "h2",
];

interface UseFirstTabPageFocusProps {
  pathname: string;
  search: string;
  hash: string;
  mainContentId?: string;
  enabled?: boolean;
}

// Pick the first matching top-of-page element, otherwise fall back to main content.
const getPreferredFocusTarget = (mainContent: HTMLElement) => {
  for (const selector of PAGE_TOP_FOCUS_TARGET_SELECTORS) {
    const target = mainContent.querySelector<HTMLElement>(selector);

    if (target) {
      return target;
    }
  }

  return mainContent;
};

// Focus helper used by the first Tab interception.
// If a target is not naturally focusable, make it programmatically focusable.
const focusTopOfMainContent = (mainContentId: string) => {
  const mainContent = document.getElementById(mainContentId);

  if (!mainContent) {
    return false;
  }

  const target = getPreferredFocusTarget(mainContent);
  const isNaturallyFocusable = target.matches(FOCUSABLE_SELECTOR);

  if (!isNaturallyFocusable && !target.hasAttribute("tabindex")) {
    target.setAttribute("tabindex", "-1");
  }

  target.focus();

  return document.activeElement === target;
};

export const useFirstTabPageFocus = ({
  pathname,
  search,
  hash,
  mainContentId = "main-content",
  enabled = true,
}: UseFirstTabPageFocusProps) => {
  // One-shot switch: true means intercept the next Tab press.
  const shouldHandleFirstTabRef = useRef(true);
  // On client-side navigation, force one interception even if stale focus is retained.
  const forceInterceptNextTabRef = useRef(false);
  // Tracks the current top focus target so we can detect view swaps on the same URL.
  const lastFocusTargetRef = useRef<HTMLElement | null>(null);

  // Recompute top target and re-arm first-Tab handling when in-page content changes.
  // This covers wizard-style flows that swap components without changing the route.
  const refreshFocusTarget = useCallback(() => {
    if (!enabled) {
      return;
    }

    const mainContent = document.getElementById(mainContentId);

    if (!mainContent) {
      lastFocusTargetRef.current = null;
      return;
    }

    const nextTarget = getPreferredFocusTarget(mainContent);
    const didTargetChange = nextTarget !== lastFocusTargetRef.current;

    lastFocusTargetRef.current = nextTarget;

    if (didTargetChange && !hash) {
      shouldHandleFirstTabRef.current = true;
    }
  }, [enabled, hash, mainContentId]);

  useEffect(() => {
    if (!enabled) {
      shouldHandleFirstTabRef.current = false;
      forceInterceptNextTabRef.current = false;
      return;
    }

    // On route/query/hash changes, enable first-Tab behavior unless this is hash navigation.
    shouldHandleFirstTabRef.current = !hash;
    forceInterceptNextTabRef.current = !hash;

    // Wait one frame so the route content has rendered before calculating the top target.
    const frameId = window.requestAnimationFrame(() => {
      refreshFocusTarget();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [pathname, search, hash, enabled, refreshFocusTarget]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const mainContent = document.getElementById(mainContentId);

    if (!mainContent) {
      return;
    }

    // Observe in-place content swaps (same URL) and re-arm first-Tab focus when needed.
    const observer = new MutationObserver(() => {
      refreshFocusTarget();
    });

    observer.observe(mainContent, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [enabled, mainContentId, refreshFocusTarget]);

  useEffect(() => {
    // Capture Tab key presses before native tabbing so we can redirect only once.
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "Tab" ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        !enabled ||
        !shouldHandleFirstTabRef.current
      ) {
        return;
      }

      const activeElement = document.activeElement;

      // If focus is already somewhere meaningful, do not override the user's context.
      if (
        activeElement &&
        activeElement !== document.body &&
        activeElement !== document.documentElement &&
        !forceInterceptNextTabRef.current
      ) {
        shouldHandleFirstTabRef.current = false;
        return;
      }

      event.preventDefault();

      // After a successful redirect, disable interception until the next view change.
      forceInterceptNextTabRef.current = false;
      shouldHandleFirstTabRef.current = !focusTopOfMainContent(mainContentId);
    };

    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [enabled, mainContentId]);
};
