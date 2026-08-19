import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Global error handler to catch and safely ignore benign browser IndexedDB/Database closing events when tabs or iframes are hidden
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || '';
    if (
      msg.includes('Database is closing') ||
      msg.includes('Database is hidden') ||
      msg.includes('IDBDatabase') ||
      msg.includes('database is closing') ||
      msg.includes('indexedDB')
    ) {
      event.preventDefault();
      console.warn('Suppressed benign database closing event:', msg);
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.includes('Database is closing') ||
      msg.includes('Database is hidden') ||
      msg.includes('IDBDatabase') ||
      msg.includes('database is closing') ||
      msg.includes('indexedDB')
    ) {
      event.preventDefault();
      console.warn('Suppressed benign database error event:', msg);
    }
  });
}

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
