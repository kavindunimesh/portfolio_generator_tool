import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/portfolioThemes.css';
import App from './App';

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  // Only register on secure contexts (HTTPS / localhost)
  if (!window.isSecureContext) return;

  void navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((reg) => {
      // Force check for updates so a fixed SW activates quickly after deploy
      void reg.update();
    })
    .catch(() => {
      // Manifest still allows install tips on supported browsers when SW eventually works
    });
}

registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
