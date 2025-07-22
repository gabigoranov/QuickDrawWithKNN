import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/AppLayout.css'
import { ToastInitializer, ToastProvider } from './context/ToastContext.tsx'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <ToastInitializer />
      <App />
    </ToastProvider>
  </StrictMode>,
)
