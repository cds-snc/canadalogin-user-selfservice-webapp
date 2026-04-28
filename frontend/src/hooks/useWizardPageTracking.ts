import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

import { trackPage } from "../utils/gatag";
import type { GA4EventParams } from "../types/utils";

export function useWizardPageTracking<TStep extends string>(
  wizardStep: TStep,
  pageByStep: Record<TStep, string>,
  additionalParams?: GA4EventParams,
) {
  const { pathname } = useLocation();
  const hasTrackedInitialStepView = useRef(false);

  useEffect(() => {
    if (!hasTrackedInitialStepView.current) {
      hasTrackedInitialStepView.current = true;
      return;
    }

    trackPage(pathname, pageByStep[wizardStep], additionalParams);
  }, [pathname, pageByStep, wizardStep, additionalParams]);
}
