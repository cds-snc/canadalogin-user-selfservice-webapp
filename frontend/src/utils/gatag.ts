import ReactGA from "react-ga4";

import { GA_CATEGORIES, GA_CLICK_EVENTS } from "./constants";
import type {
  AnalyticsPayload,
  AnalyticsTrackEvent,
  GA4EventParams,
  CardClickParams,
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

export function trackAnalyticsEvent({
  event,
  form_id,
  step,
  type,
  error,
  duration_ms,
}: AnalyticsTrackEvent) {
  const params: GA4EventParams = { form_id, step };
  if (type !== undefined) params.type = type;
  if (error !== undefined) params.error = error;
  if (duration_ms !== undefined) params.duration_ms = duration_ms;
  ReactGA.event(event, params);
}

export function trackCardClick(params: CardClickParams) {
  trackGA4Event(GA_CLICK_EVENTS.CARD_CLICK, params);
}

export function trackButtonClick(
  buttonName: string,
  additionalParams?: GA4EventParams,
) {
  trackGA4Event(GA_CLICK_EVENTS.BUTTON_CLICK, {
    button_name: buttonName,
    ...additionalParams,
  });
}
