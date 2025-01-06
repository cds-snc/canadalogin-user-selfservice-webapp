import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import './i18n';

console.log('Starting React application...'); // Debug log

const renderApp = () => {
  try {
    ReactDOM.render(
      <React.StrictMode>
        <React.Suspense fallback="Loading...">
          <App />
        </React.Suspense>
      </React.StrictMode>,
      document.getElementById('root')
    );
    console.log('React application rendered successfully'); // Debug log
  } catch (error) {
    console.error('Error rendering React application:', error);
  }
};

renderApp(); 