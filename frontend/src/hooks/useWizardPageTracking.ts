import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

import { trackPage } from "../utils/gatag";

export function useWizardPageTracking<TStep extends string>(
  wizardStep: TStep,
  pageByStep: Record<TStep, string>,
) {
  const { pathname } = useLocation();
  const hasTrackedInitialStepView = useRef(false);

  useEffect(() => {
    if (!hasTrackedInitialStepView.current) {
      hasTrackedInitialStepView.current = true;
      return;
    }

    trackPage(pathname, pageByStep[wizardStep]);
  }, [pathname, pageByStep, wizardStep]);
}
