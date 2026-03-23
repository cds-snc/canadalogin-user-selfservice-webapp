import { usePageTracking } from "./hooks/usePageTracking";
import { Suspense, StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "@cdssnc/gcds-components-react/gcds.css";
import "./index.css";
import router from "./router";
import { RouterProvider } from "react-router";
import ReactGA from "react-ga4";
import config from "./config";

function AppWrapper() {
  usePageTracking();

  useEffect(() => {
    ReactGA.initialize(config.gatag, {
      gaOptions: {
        anonymize_ip: true,
      },
    });
  }, []);

  return <RouterProvider router={router} />;
}

function App() {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error('Root element with id "root" not found');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <Suspense fallback="Loading...">
        <AppWrapper />
      </Suspense>
    </StrictMode>,
  );
}

export default App;