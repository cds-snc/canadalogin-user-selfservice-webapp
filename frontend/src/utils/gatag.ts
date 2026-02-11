import ReactGA from "react-ga4";
import { GA_CATEGORIES } from "./constants";

export function trackPage(path: string, page: string): void {
  ReactGA.send({ hitType: GA_CATEGORIES.pageView, page: path, title: page });
}

interface TrackEventParams {
  category: string;
  action: string;
  label: string;
}

export function trackEvent({
  category,
  action,
  label,
}: TrackEventParams): void {
  ReactGA.event({ category: category, action: action, label: label });
}
