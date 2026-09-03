import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App.tsx'
import './index.css'

// Entry point: find <div id="root"> in index.html and render React into it.
//  - StrictMode surfaces bugs in development (it double-invokes some functions).
//  - BrowserRouter gives the app real URLs (/guide, /about) using the History API.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
