import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App.tsx'
import { SettingsProvider } from './hooks/useSettings.tsx'
import { SessionRecorderProvider } from './hooks/useSessionRecorder.tsx'
import './index.css'

// Entry point: find <div id="root"> in index.html and render React into it.
//  - StrictMode surfaces bugs in development (it double-invokes some functions).
//  - BrowserRouter gives the app real URLs (/guide, /about) using the History API.
//  - SettingsProvider / SessionRecorderProvider make user settings and the live
//    session data available to every page.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <SessionRecorderProvider>
          <App />
        </SessionRecorderProvider>
      </SettingsProvider>
    </BrowserRouter>
  </StrictMode>,
)
