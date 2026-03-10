import ReactGA from "react-ga4";

import { GA_CATEGORIES } from "./constants";
import type { AnalyticsPayload } from "../types/utils";

export function trackPage(path: string, page?: string) {
  ReactGA.send({ hitType: GA_CATEGORIES.pageView, page: path, title: page });
}

export function trackEvent({ category, action, label }: AnalyticsPayload) {
  ReactGA.event({ category, action, label });
}
