import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// TURN/ICE config — Metered OpenRelay (publishable credentials, safe client-side).
// Override via env at build time if rotated: VITE_TURN_URL / VITE_TURN_USERNAME / VITE_TURN_CREDENTIAL
{
  const TURN_URL = import.meta.env.VITE_TURN_URL ||
    'turn:global.relay.metered.ca:80,turn:global.relay.metered.ca:80?transport=tcp,turn:global.relay.metered.ca:443,turns:global.relay.metered.ca:443?transport=tcp';
  const TURN_USER = import.meta.env.VITE_TURN_USERNAME || '0cbf189db1e644abd33a4068';
  const TURN_PASS = import.meta.env.VITE_TURN_CREDENTIAL || 'KZg5YAjoC4AXCbML';
  window.__SNAP_ICE_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.relay.metered.ca:80' },
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: TURN_URL.split(',').map(s => s.trim()),
        username: TURN_USER,
        credential: TURN_PASS
      }
    ],
    iceCandidatePoolSize: 4
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
