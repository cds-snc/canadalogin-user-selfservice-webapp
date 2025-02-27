import {Suspense, StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import '@cdssnc/gcds-components-react/gcds.css';
import App from './App.jsx';
//need to remove when demo code removed
import './index.css';



console.log('Starting React application...here');// Debug log

try {
    createRoot(document.getElementById('root')).render(
        <StrictMode>
            <Suspense fallback="Loading...">
                <App/>
            </Suspense>
        </StrictMode>
    );
    console.log('React application rendered successfully'); // Debug log
} catch (error) {
    console.error('Error rendering React application:', error);
}