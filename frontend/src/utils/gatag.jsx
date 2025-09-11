import ReactGA from "react-ga4";
import { GA_CATEGORIES } from "./constants.jsx";

export function trackPage(path, page) {
  ReactGA.send({ hitType: GA_CATEGORIES.pageView, page: path, title: page });
}

export function trackEvent({ category, action, label }) {
  ReactGA.event({ category: category, action: action, label: label });
}
