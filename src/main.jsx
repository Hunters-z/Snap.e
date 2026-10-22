import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// TURN/ICE config injectable at build time (Vite env) — REQUIRED for
// WebRTC connections across different networks (NAT traversal).
// Set in .env.production:  VITE_TURN_URL / VITE_TURN_USERNAME / VITE_TURN_CREDENTIAL
if (import.meta.env.VITE_TURN_URL) {
  window.__SNAP_ICE_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: import.meta.env.VITE_TURN_URL.split(',').map(s => s.trim()),
        username: import.meta.env.VITE_TURN_USERNAME || '',
        credential: import.meta.env.VITE_TURN_CREDENTIAL || ''
      }
    ],
    iceCandidatePoolSize: 4
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
