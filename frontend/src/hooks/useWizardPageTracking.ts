import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router";

import { useRelyingPartyAnalyticsParams } from "./useRelyingPartyAnalyticsParams";
import { trackPage } from "../utils/gatag";
import type { GA4EventParams } from "../types/utils";

export function useWizardPageTracking<TStep extends string>(
  wizardStep: TStep,
  pageByStep: Record<TStep, string>,
  additionalParams?: GA4EventParams,
) {
  const { pathname } = useLocation();
  const mergedParams = useRelyingPartyAnalyticsParams(additionalParams);
  const additionalParamsRef = useRef<GA4EventParams | undefined>(mergedParams);
  const lastTrackedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    additionalParamsRef.current = mergedParams;
  }, [mergedParams]);

  useLayoutEffect(() => {
    const stepPageId = pageByStep[wizardStep];
    const trackKey = `${pathname}|${stepPageId}`;

    if (lastTrackedKeyRef.current === trackKey) {
      return;
    }

    lastTrackedKeyRef.current = trackKey;
    trackPage(pathname, stepPageId, additionalParamsRef.current);
  }, [pathname, pageByStep, wizardStep]);
}
