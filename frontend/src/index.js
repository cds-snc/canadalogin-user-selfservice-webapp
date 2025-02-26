import {Suspense, StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import App from './App';
import './i18n';

console.log('Starting React application...'); // Debug log

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