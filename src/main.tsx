import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Acceso } from './modulos/autenticacion/Acceso'

const rootElement = document.getElementById('root')!
const isAdminPreview = import.meta.env.DEV && /^\/admin\/preview(?:\/|$)/.test(window.location.pathname)
const AdminPreview = import.meta.env.DEV ? lazy(() => import('./modulos/administracion/AdminPreview')) : null
// El módulo de autenticación resuelve acceso, registro y destinos protegidos.
// El maquetado de desarrollo se monta por separado y conserva su aviso de referencia.
const isLogin = !isAdminPreview && /^\/(?:login|registro|cuenta|admin)(?:\/|$)/.test(window.location.pathname)
const isInicio = !isAdminPreview && !isLogin

if (isAdminPreview) rootElement.classList.add('admin-preview-root')
if (isLogin) rootElement.classList.add('acceso-root')
if (isInicio) rootElement.classList.add('inicio-root')

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
