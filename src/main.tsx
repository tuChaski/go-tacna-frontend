import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('root')!
const isAdminPreview = import.meta.env.DEV && /^\/admin\/preview(?:\/|$)/.test(window.location.pathname)
const AdminPreview = import.meta.env.DEV ? lazy(() => import('./modulos/administracion/AdminPreview')) : null

if (isAdminPreview) rootElement.classList.add('admin-preview-root')

createRoot(rootElement).render(
  <StrictMode>
    {isAdminPreview && AdminPreview ? (
      <Suspense fallback={<p>Cargando vista previa…</p>}>
        <AdminPreview />
      </Suspense>
    ) : <App />}
  </StrictMode>,
)
