import ReactGA from "react-ga4";

import { GA_CATEGORIES, GA4_EVENTS } from "./constants";
import type { 
  AnalyticsPayload, 
  GA4EventParams, 
  CardClickParams, 
  NavigationParams,
  FormStepTrackingParams,
  FormApiCallParams
} from "../types/utils";

export function trackPage(path: string, page?: string) {
  ReactGA.send({ hitType: GA_CATEGORIES.pageView, page: path, title: page });
}

export function trackEvent({ category, action, label }: AnalyticsPayload) {
  ReactGA.event({ category, action, label });
}
export function trackGA4Event(eventName: string, params?: GA4EventParams) {
  ReactGA.event(eventName, params);
}

export function trackCardClick(params: CardClickParams) {
  trackGA4Event(GA4_EVENTS.CARD_CLICK, params);
}

export function trackNavigation(params: NavigationParams) {
  trackGA4Event(GA4_EVENTS.NAVIGATION, params);
}

export function trackButtonClick(buttonName: string, additionalParams?: GA4EventParams) {
  trackGA4Event(GA4_EVENTS.BUTTON_CLICK, {
    button_name: buttonName,
    ...additionalParams,
  });
}

export function trackLinkClick(linkText: string, destination: string, additionalParams?: GA4EventParams) {
  trackGA4Event(GA4_EVENTS.LINK_CLICK, {
    link_text: linkText,
    destination,
    ...additionalParams,
  });
}

export function trackFormSubmit(formName: string, additionalParams?: GA4EventParams) {
  trackGA4Event(GA4_EVENTS.FORM_SUBMIT, {
    form_name: formName,
    ...additionalParams,
  });
}

// Form tracking functions
export function trackFormStepStart(params: FormStepTrackingParams) {
  trackGA4Event(GA4_EVENTS.FORM_STEP_START, {
    event_category: "form_interaction",
    ...params,
  });
}

export function trackFormStepComplete(params: FormStepTrackingParams) {
  trackGA4Event(GA4_EVENTS.FORM_STEP_COMPLETE, {
    event_category: "form_interaction",
    ...params,
  });
}

export function trackFormStepEnd(params: FormStepTrackingParams) {
  trackGA4Event(GA4_EVENTS.FORM_STEP_END, {
    event_category: "form_interaction",
    ...params,
  });
}

export function trackFormStepDuration(params: FormStepTrackingParams) {
  trackGA4Event(GA4_EVENTS.FORM_STEP_DURATION, params);
}

export function trackFormApiCallStart(params: FormApiCallParams) {
  trackGA4Event(GA4_EVENTS.FORM_API_CALL_START, {
    event_category: "api_call",
    ...params,
  });
}

export function trackFormApiCallEnd(params: FormApiCallParams) {
  trackGA4Event(GA4_EVENTS.FORM_API_CALL_END, {
    event_category: "api_call",
    ...params,
  });
}
