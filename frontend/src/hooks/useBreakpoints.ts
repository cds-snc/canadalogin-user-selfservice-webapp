import { useEffect, useState } from "react";

export function useBreakpoints() {
  const queries = {
    mobile: "(max-width: 47.999em)",
    tablet: "(min-width: 48em) and (max-width: 63.999em)",
  };

  const getMatches = () => ({
    mobile: window.matchMedia(queries.mobile).matches,
    tablet: window.matchMedia(queries.tablet).matches,
  });

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    const mediaQueryLists = Object.values(queries).map((q) =>
      window.matchMedia(q),
    );

    const handler = () => setMatches(getMatches());

    mediaQueryLists.forEach((mql) => mql.addEventListener("change", handler));

    return () =>
      mediaQueryLists.forEach((mql) =>
        mql.removeEventListener("change", handler),
      );
  }, []);

  return matches; // { mobile: boolean, tablet: boolean }
}
