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
  const additionalParamsRef = useRef<GA4EventParams | undefined>(
    additionalParams,
  );

  useEffect(() => {
    additionalParamsRef.current = additionalParams;
  }, [additionalParams]);

  useEffect(() => {
    if (!hasTrackedInitialStepView.current) {
      hasTrackedInitialStepView.current = true;
      return;
    }

    trackPage(pathname, pageByStep[wizardStep], additionalParamsRef.current);
  }, [pathname, pageByStep, wizardStep]);
}
