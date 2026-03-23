import { useEffect } from "react";
import { useLocation } from "react-router";
import ReactGA from "react-ga4";
import config from "../config";

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const page = location.pathname + location.search;
    ReactGA.send({ hitType: "pageview   ", page });
    
    if (config.environment === "dev") {
      console.log("GA Pageview:", page);
    }
  }, [location]);
};
