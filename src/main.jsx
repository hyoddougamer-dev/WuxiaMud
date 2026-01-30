import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './contexts/SettingsContext'
import { AuthProvider } from './contexts/AuthContext'
import { MusicProvider } from './contexts/MusicContext'

// Register Service Worker for PWA (online-only, no offline cache)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('🎮 PWA: Service Worker registered');
        // Check for updates
        registration.addEventListener('updatefound', () => {
          console.log('🔄 PWA: New version available');
        });
      })
      .catch((error) => {
        console.log('PWA: Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <MusicProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </MusicProvider>
    </AuthProvider>
  </StrictMode>,
)
