import { Suspense, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@cdssnc/gcds-components-react/gcds.css';
import App from './App.jsx';
//need to remove when demo code removed
import './index.css';
import { BrowserRouter } from "react-router";
import { UserProvider } from "./components/Providers/UserProvider";
import TargetUrl from "./components/Providers/TargetUrl.tsx";
import ReactGA from "react-ga4";
import config from "./config.jsx";

console.log('Starting React application...here');// Debug log

ReactGA.initialize(config.gatag, {
    gaOptions: {
        anonymize_ip: true
    }
});
try {
    createRoot(document.getElementById('root')).render(
        <StrictMode>
            <Suspense fallback="Loading...">
                <UserProvider>
                    <TargetUrl />
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                </UserProvider>
            </Suspense>
        </StrictMode>
    );
    console.log('React application rendered successfully'); // Debug log
} catch (error) {
    console.error('Error rendering React application:', error);
}