import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { IncidentBoundary } from './components/IncidentBoundary';
import { reportLandingIncident } from './lib/reportIncident';

window.addEventListener('error', (event) => {
  reportLandingIncident('window-error', event.error ?? event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  reportLandingIncident('unhandled-rejection', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IncidentBoundary><App /></IncidentBoundary>
  </StrictMode>,
);
