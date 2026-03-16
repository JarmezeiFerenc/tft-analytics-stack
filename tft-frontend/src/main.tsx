import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TftMetadataProvider } from './context/TftAssetContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TftMetadataProvider>
      <App />
    </TftMetadataProvider>
  </StrictMode>,
)
