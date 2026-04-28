import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

import { useUser } from "../components/Providers/useUser";
import { trackPage } from "../utils/gatag";
import { getAnalyticsRelyingPartyParams } from "../utils/relyingPartyAnalytics";
import type { GA4EventParams } from "../types/utils";

export function useWizardPageTracking<TStep extends string>(
  wizardStep: TStep,
  pageByStep: Record<TStep, string>,
  additionalParams?: GA4EventParams,
) {
  const { pathname } = useLocation();
  const { state } = useUser();
  const rpParams = getAnalyticsRelyingPartyParams(state.relyingPartyInfo);
  const hasTrackedInitialStepView = useRef(false);
  const additionalParamsRef = useRef<GA4EventParams | undefined>({
    ...rpParams,
    ...additionalParams,
  });

  useEffect(() => {
    additionalParamsRef.current = { ...rpParams, ...additionalParams };
  }, [rpParams, additionalParams]);

  useEffect(() => {
    if (!hasTrackedInitialStepView.current) {
      hasTrackedInitialStepView.current = true;
      return;
    }

    trackPage(pathname, pageByStep[wizardStep], additionalParamsRef.current);
  }, [pathname, pageByStep, wizardStep]);
}
