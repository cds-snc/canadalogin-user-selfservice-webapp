import { Suspense, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@cdssnc/gcds-components-react/gcds.css';
import App from './App.jsx';
//need to remove when demo code removed
import './index.css';
import { BrowserRouter } from "react-router";
import ReactGA from "react-ga4";
import { UserProvider } from "./components/Providers/UserProvider";
import { LanguageProvider } from './components/Providers/LanguageProvider';

import config from "./config.jsx";
import { AppLanguageSetup } from './components/Providers/AppLanguageSetup';

ReactGA.initialize(config.gatag, {
    gaOptions: {
        anonymize_ip: true
    }
});
try {
    createRoot(document.getElementById('root')).render(
        <StrictMode>
            <Suspense fallback="Loading...">
                <BrowserRouter>
                    <UserProvider>
                        <LanguageProvider>
                            <AppLanguageSetup />
                            <App />
                        </LanguageProvider>
                    </UserProvider>
                </BrowserRouter>
            </Suspense>
        </StrictMode >
    );
    console.log('React application rendered successfully'); // Debug log
} catch (error) {
    console.error('Error rendering React application:', error);
}