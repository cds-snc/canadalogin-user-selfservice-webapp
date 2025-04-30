import ReactGA from "react-ga4";

export function trackPage(path) {
    trackEvent('event', 'page_view', {
      page_path: path,
    });
  }

export function trackEvent({ category, action, label }) {
    ReactGA.event({
        category,
        action,
        label
    });
}