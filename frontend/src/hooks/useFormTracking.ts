import { useCallback, useRef } from "react";
import { trackAnalyticsEvent } from "../utils/gatag";
import { GA_FORM_EVENTS } from "../utils/analyticsConstants";
import type { AnalyticsTrackEvent } from "../types/utils";

interface UseFormTrackingOptions {
  formId: string;
}

export function useFormTracking({ formId }: UseFormTrackingOptions) {
  const activeStepRef = useRef<string | null>(null);
  const stepStartTimeRef = useRef<number | null>(null);

  const trackEvent = useCallback(
    (params: Omit<AnalyticsTrackEvent, "form_id">) => {
      const now = Date.now();
      const shouldEndActiveStep =
        params.event === GA_FORM_EVENTS.FORM_STEP_CHANGE ||
        params.event === GA_FORM_EVENTS.FORM_STEP_END ||
        params.event === GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE;

      if (
        shouldEndActiveStep &&
        activeStepRef.current &&
        stepStartTimeRef.current !== null
      ) {
        trackAnalyticsEvent({
          event: GA_FORM_EVENTS.FORM_STEP_DURATION,
          form_id: formId,
          step: activeStepRef.current,
          type: params.type,
          duration_ms: now - stepStartTimeRef.current,
        });
      }

      trackAnalyticsEvent({ ...params, form_id: formId });

      if (params.event === GA_FORM_EVENTS.FORM_STEP_START) {
        activeStepRef.current = params.step;
        stepStartTimeRef.current = now;
      } else if (params.event === GA_FORM_EVENTS.FORM_STEP_CHANGE) {
        activeStepRef.current = params.step;
        stepStartTimeRef.current = now;
      } else if (shouldEndActiveStep) {
        activeStepRef.current = null;
        stepStartTimeRef.current = null;
      }
    },
    [formId],
  );

  return { trackEvent };
}
