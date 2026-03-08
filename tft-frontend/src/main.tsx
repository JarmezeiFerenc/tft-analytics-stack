import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TftAssetProvider } from './context/TftAssetContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TftAssetProvider>
      <App />
    </TftAssetProvider>
  </StrictMode>,
)
