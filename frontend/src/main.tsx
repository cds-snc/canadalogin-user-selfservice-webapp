import { Suspense, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@gcds-core/components-react/gcds.css";
//need to remove when demo code removed
import "./index.css";
import "./i18n";
import router from "./router";
import { RouterProvider } from "react-router";
import ReactGA from "react-ga4";

import config from "./config";
import { VITE_ENVIRONMENTS } from "./utils/constants";

if (config.gatag) {
  ReactGA.initialize(config.gatag, {
    gaOptions: {
      anonymize_ip: true,
      debug_mode: config.environment === VITE_ENVIRONMENTS.dev,
    },
  });
}

try {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error('Root element with id "root" not found');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <Suspense fallback="Loading...">
        <RouterProvider router={router} />
      </Suspense>
    </StrictMode>,
  );
} catch (error) {
  console.error("Error rendering React application:", error);
}
