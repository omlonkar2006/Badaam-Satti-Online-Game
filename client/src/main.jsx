import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SocketProvider } from './context/SocketContext.jsx'
import { AudioProvider } from './context/AudioContext.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SocketProvider>
      <AudioProvider>
        <App />
      </AudioProvider>
    </SocketProvider>
  </StrictMode>,
)
