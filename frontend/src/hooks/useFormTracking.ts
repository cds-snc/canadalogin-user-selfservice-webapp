import { useEffect, useRef, useCallback } from "react";
import {
  trackFormStepStart,
  trackFormStepComplete,
  trackFormStepEnd,
  trackFormStepDuration,
  trackFormApiCallStart,
  trackFormApiCallEnd,
} from "../utils/gatag";

interface UseFormTrackingOptions {
  formId: string;
  page: string;
  initialStep: string;
}

export function useFormTracking({
  formId,
  page,
  initialStep,
}: UseFormTrackingOptions) {
  const stepStartTime = useRef(Date.now());
  const currentStep = useRef(initialStep);
  const attempts = useRef(0);

  useEffect(() => {
    stepStartTime.current = Date.now();

    return () => {
      trackFormStepDuration({
        form_id: formId,
        page,
        step: currentStep.current,
        duration_ms: Date.now() - stepStartTime.current,
      });
    };
  }, [formId, page]);

  const trackStepChange = useCallback(
    (newStep: string, postAction?: string) => {
      trackFormStepComplete({
        form_id: formId,
        page,
        step: currentStep.current,
        post_action: postAction,
        duration_ms: Date.now() - stepStartTime.current,
        attempts: attempts.current,
      });

      currentStep.current = newStep;
      stepStartTime.current = Date.now();
      attempts.current = 0;

      trackFormStepStart({
        form_id: formId,
        page: newStep,
        step: newStep,
        post_action: postAction,
        attempts: 0,
      });
    },
    [formId, page],
  );

  const trackStepAttempt = useCallback(
    (eventLabel: string, postAction?: string) => {
      attempts.current += 1;

      trackFormStepStart({
        form_id: formId,
        page,
        step: currentStep.current,
        post_action: postAction,
        event_label: eventLabel,
        attempts: attempts.current,
      });
    },
    [formId, page],
  );

  const trackStepError = useCallback(
    (eventLabel: string, postAction?: string) => {
      trackFormStepEnd({
        form_id: formId,
        page,
        step: currentStep.current,
        post_action: postAction,
        event_label: eventLabel,
        duration_ms: Date.now() - stepStartTime.current,
        attempts: attempts.current,
      });
    },
    [formId, page],
  );

  const trackApiCall = useCallback(
    async <T>(
      apiId: string,
      apiType: string,
      apiCall: () => Promise<T>,
      postAction?: string,
    ): Promise<T> => {
      const apiStartTime = Date.now();

      trackFormApiCallStart({
        form_id: formId,
        page,
        step: currentStep.current,
        post_action: postAction,
        api_id: apiId,
        api_type: apiType,
      });

      try {
        const result = await apiCall();

        trackFormApiCallEnd({
          form_id: formId,
          page,
          step: currentStep.current,
          post_action: postAction,
          api_id: apiId,
          api_type: apiType,
          duration: Date.now() - apiStartTime,
          status: "success",
        });

        return result;
      } catch (error) {
        trackFormApiCallEnd({
          form_id: formId,
          page,
          step: currentStep.current,
          post_action: postAction,
          api_id: apiId,
          api_type: apiType,
          duration: Date.now() - apiStartTime,
          status: "error",
          error_id: apiId,
          error_message:
            error instanceof Error ? error.message : "Unknown error",
        });

        throw error;
      }
    },
    [formId, page],
  );

  return {
    trackStepChange,
    trackStepAttempt,
    trackStepError,
    trackApiCall,
  };
}
