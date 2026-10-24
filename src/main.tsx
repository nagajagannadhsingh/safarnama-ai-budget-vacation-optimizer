import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Gracefully handle preview environment WebSocket closed notices
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event?.reason?.message || String(event?.reason || '');
    if (msg.includes('WebSocket') || msg.includes('ws://') || msg.includes('wss://')) {
      event.preventDefault();
      // Informative debug notice without breaking application execution
      console.debug('[Vite Preview Environment] Suppressed preview proxy WebSocket notice:', msg);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
