import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register standard Vite PWA
import { registerSW } from 'virtual:pwa-register';
const updateSW = registerSW({
  onNeedRefresh() {
    // We could show a prompt here, but auto-update is fine for now
  },
  onOfflineReady() {
    console.log('App is ready to work offline, all TTS assets cached.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
