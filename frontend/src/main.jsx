import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './context/ToastProvider.jsx'
import { AuthProvider } from './context/AuthProvider.jsx'
import { SessionProvider } from './context/SessionProvider.jsx'
import { ReserveProvider } from './context/ReserveProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SessionProvider>
            <ReserveProvider>
              <App />
            </ReserveProvider>
          </SessionProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
)
