import ReactGA from "react-ga4";
import { GA_CATEGORIES } from "./constants";

export function trackPage(path: string, page?: string): void {
  ReactGA.send({ hitType: GA_CATEGORIES.pageView, page: path, title: page });
}

export function trackEvent({
  category,
  action,
  label,
}: {
  category: string;
  action: string;
  label?: string;
}): void {
  ReactGA.event({ category: category, action: action, label: label });
}
