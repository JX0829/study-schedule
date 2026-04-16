import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppParent from './AppParent.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppParent />
  </StrictMode>,
)