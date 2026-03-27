import { useEffect, useRef, useCallback } from "react";
import {
  trackFormStepStart,
  trackFormStepComplete,
  trackFormStepEnd,
  trackFormStepDuration,
  trackFormSubmitEvent,
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
  const formInitiatedTime = useRef(Date.now());
  const stepStartTime = useRef(Date.now());
  const currentStep = useRef(initialStep);
  const attempts = useRef(0);

  useEffect(() => {
    formInitiatedTime.current = Date.now();
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
      stepStartTime.current = Date.now();
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

  const trackFormSubmit = useCallback(
    (eventLabel: string, postAction: string = "verify") => {
      trackFormSubmitEvent({
        event_category: "form_interaction",
        form_id: "gc_signin",
        page,
        post_action: postAction,
        step: page,
        event_label: eventLabel,
        duration_ms: Date.now() - formInitiatedTime.current,
        attempts: attempts.current,
      });
    },
    [page],
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

  const trackSuccess = useCallback(
    (eventLabel: string, postAction?: string) => {
      trackFormStepComplete({
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

  const trackInteraction = useCallback(
    (eventLabel: string, postAction?: string) => {
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

  return {
    trackStepChange,
    trackStepAttempt,
    trackFormSubmit,
    trackStepError,
    trackSuccess,
    trackInteraction,
  };
}
