import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Tipografías servidas desde la propia web (paquetes @fontsource), no desde
// Google Fonts: funciona sin conexión y no envía la IP del visitante a Google.
import '@fontsource/sora/400.css'
import '@fontsource/sora/500.css'
import '@fontsource/sora/600.css'
import '@fontsource/sora/700.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import './index.css'
import App from './App.jsx'
import { DebugProvider, DebugToggle } from './debug'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DebugProvider>
      <App />
      <DebugToggle />
    </DebugProvider>
  </StrictMode>,
)
