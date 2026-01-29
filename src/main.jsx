import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './contexts/SettingsContext'
import { AuthProvider } from './contexts/AuthContext'
import { MusicProvider } from './contexts/MusicContext'

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
