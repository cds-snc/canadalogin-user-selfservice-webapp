import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router";

export function usePageScrollRestoration() {
  const { key, hash } = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map<string, { x: number; y: number }>());

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    const savedPosition = positions.current.get(key);

    if (navigationType === "POP" && savedPosition) {
      window.scrollTo(savedPosition.x, savedPosition.y);
    } else if (hash) {
      let targetId = hash.slice(1);
      try {
        targetId = decodeURIComponent(targetId);
      } catch (error) {
        console.warn("Unable to decode scroll target:", hash, error);
      }

      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView();
      } else if (navigationType !== "POP") {
        window.scrollTo(0, 0);
      }
    } else if (navigationType !== "POP") {
      window.scrollTo(0, 0);
    }

    // Capture the outgoing position before the next layout effect restores it.
    const currentPositions = positions.current;
    return () => {
      currentPositions.set(key, { x: window.scrollX, y: window.scrollY });
    };
  }, [key, hash, navigationType]);
}
