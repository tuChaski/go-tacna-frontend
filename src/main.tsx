import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Acceso } from './modulos/autenticacion/Acceso'

const rootElement = document.getElementById('root')!
const isAdminPreview = import.meta.env.DEV && /^\/admin\/preview(?:\/|$)/.test(window.location.pathname)
const AdminPreview = import.meta.env.DEV ? lazy(() => import('./modulos/administracion/AdminPreview')) : null
// El login tiene URL propia también en producción; su primera entrega valida
// campos, mientras la autenticación y los destinos por rol esperan el contrato.
const isLogin = /^\/login\/?$/.test(window.location.pathname)

if (isAdminPreview) rootElement.classList.add('admin-preview-root')
if (isLogin) rootElement.classList.add('acceso-root')

createRoot(rootElement).render(
  <StrictMode>
    {isLogin ? (
      <Acceso />
    ) : isAdminPreview && AdminPreview ? (
      <Suspense fallback={<p>Cargando vista previa…</p>}>
        <AdminPreview />
      </Suspense>
    ) : <App />}
  </StrictMode>,
)
