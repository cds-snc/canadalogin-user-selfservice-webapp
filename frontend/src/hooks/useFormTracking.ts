import { useCallback, useEffect, useRef } from "react";
import { useRelyingPartyAnalyticsParams } from "./useRelyingPartyAnalyticsParams";
import { trackAnalyticsEvent } from "../utils/gatag";
import { GA_FORM_EVENTS } from "../utils/analyticsConstants";
import type { AnalyticsTrackEvent, GA4EventParams } from "../types/utils";

interface UseFormTrackingOptions {
  formId: string;
  commonParams?: GA4EventParams;
}

export function useFormTracking({
  formId,
  commonParams,
}: UseFormTrackingOptions) {
  const mergedParams = useRelyingPartyAnalyticsParams(commonParams);
  const activeStepRef = useRef<string | null>(null);
  const stepStartTimeRef = useRef<number | null>(null);
  const commonParamsRef = useRef<GA4EventParams | undefined>(mergedParams);

  useEffect(() => {
    commonParamsRef.current = mergedParams;
  }, [formId, mergedParams]);

  const trackEvent = useCallback(
    (params: Omit<AnalyticsTrackEvent, "form_id">) => {
      const now = Date.now();
      const shouldEndActiveStep =
        params.event === GA_FORM_EVENTS.FORM_STEP_CHANGE ||
        params.event === GA_FORM_EVENTS.FORM_STEP_END ||
        params.event === GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE;

      if (shouldEndActiveStep && activeStepRef.current) {
        if (params.event !== GA_FORM_EVENTS.FORM_STEP_END) {
          trackAnalyticsEvent(
            {
              event: GA_FORM_EVENTS.FORM_STEP_END,
              form_id: formId,
              step: activeStepRef.current,
              type: params.type,
              error: params.error,
            },
            commonParamsRef.current,
          );
        }

        if (stepStartTimeRef.current !== null) {
          trackAnalyticsEvent(
            {
              event: GA_FORM_EVENTS.FORM_STEP_DURATION,
              form_id: formId,
              step: activeStepRef.current,
              type: params.type,
              duration_ms: now - stepStartTimeRef.current,
            },
            commonParamsRef.current,
          );
        }
      }

      trackAnalyticsEvent(
        { ...params, form_id: formId },
        commonParamsRef.current,
      );

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
