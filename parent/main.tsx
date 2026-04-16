import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/index.css'
import AppParent from '../src/AppParent.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppParent />
  </StrictMode>,
)