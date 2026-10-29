import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// TURN/ICE config — Metered OpenRelay (publishable credentials, safe client-side).
// Override via env at build time if rotated: VITE_TURN_URL / VITE_TURN_USERNAME / VITE_TURN_CREDENTIAL
{
  const TURN_URL = import.meta.env.VITE_TURN_URL;
  const TURN_USER = import.meta.env.VITE_TURN_USERNAME;
  const TURN_PASS = import.meta.env.VITE_TURN_CREDENTIAL;
  if (!TURN_URL || !TURN_USER || !TURN_PASS) {
    console.warn('TURN config missing: set VITE_TURN_URL / VITE_TURN_USERNAME / VITE_TURN_CREDENTIAL (see .env.example). Continuing with STUN only.');
  }
  const iceServers = [
    { urls: 'stun:stun.relay.metered.ca:80' },
    { urls: 'stun:stun.l.google.com:19302' }
  ];
  if (TURN_URL && TURN_USER && TURN_PASS) {
    iceServers.push({
      urls: TURN_URL.split(',').map(s => s.trim()),
      username: TURN_USER,
      credential: TURN_PASS
    });
  }
  window.__SNAP_ICE_CONFIG = { iceServers, iceCandidatePoolSize: 4 };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
