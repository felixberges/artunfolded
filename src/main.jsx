import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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
