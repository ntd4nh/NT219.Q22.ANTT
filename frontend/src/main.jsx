import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../AquaTrade_B2B-Seafood-Marketplace/frontend/src/index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
