import { useMemo } from "react";

import { useUser } from "../components/Providers/useUser";
import { getAnalyticsRelyingPartyParams } from "../utils/relyingPartyAnalytics";
import type { GA4EventParams } from "../types/utils";

export function useRelyingPartyAnalyticsParams(
  additionalParams?: GA4EventParams,
) {
  const { state } = useUser();
  const rpParams = useMemo(
    () => getAnalyticsRelyingPartyParams(state.relyingPartyInfo),
    [state.relyingPartyInfo],
  );

  return useMemo(
    () => ({
      ...additionalParams,
      ...rpParams,
    }),
    [additionalParams, rpParams],
  );
}
