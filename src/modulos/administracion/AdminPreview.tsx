/** Monta la navegación de revisión de T059; el acceso autenticado sigue pendiente. */
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Building2, BusFront, House, Route as RouteIcon, Users } from 'lucide-react';
import busFront from './recursos/bus-front.svg';
import { FormularioEmpresa } from './empresas/FormularioEmpresa';
import { empresaReferencia } from './empresas/empresa-referencia';
import { camposEmpresa, camposAdministrador } from './empresas/formulario-empresa';
import { PageHeading } from './componentes/PageHeading';
import { PendingNotice } from './componentes/PendingNotice';
import { CompanyHome } from './CompanyHome';
import { DialogoEliminarEmpresa } from './empresas/DialogoEliminarEmpresa';
import { RouteList } from './rutas/RouteList';
import { RouteForm } from './rutas/RouteForm';
import { RouteDetail } from './rutas/RouteDetail';
import { companyPreviewPath, referenceRoute, routesPreviewPath } from './rutas/route-reference';
import { ListadoConductores } from './conductores/ListadoConductores';
import { FormularioConductor } from './conductores/FormularioConductor';
import { DetalleConductor } from './conductores/DetalleConductor';
import { conductorReferencia, rutaConductores } from './conductores/conductor-referencia';
import { ListadoMicros } from './micros/ListadoMicros';
import { FormularioMicro } from './micros/FormularioMicro';
import { DetalleMicro } from './micros/DetalleMicro';
import { microReferencia, rutaMicros } from './micros/micro-referencia';
import '@fontsource-variable/inter';
import './admin.css';

const base = '/admin/preview';

function CompanyContext({ children, name = empresaReferencia.razonSocial }: { children?: ReactNode; name?: string }) {
  return <aside className="admin-card admin-context" aria-label="Contexto de la empresa">
    <h2>{name}</h2>
    <p className="admin-muted">El administrador de esta empresa gestionará únicamente sus rutas, micros y conductores.</p>
    <p>Entrega el correo y la contraseña inicial al administrador de la empresa. La contraseña no se muestra en la consulta.</p>
    {children}
  </aside>;
}

function HomePage() {
  return <>
    <PageHeading title="Administración general" description="Registra las empresas que utilizarán Go Tacna y crea su acceso administrativo." />
    <section className="admin-card admin-home-card">
      <h2>Empresas de transporte</h2>
      <p className="admin-muted">Cada empresa gestiona sus propias rutas, micros y conductores.</p>
      <Link className="admin-button" to={`${base}/empresas`}>Gestionar empresas</Link>
    </section>
    <PendingNotice />
  </>;
}

function StateDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog className="admin-dialog" ref={dialog} onCancel={onClose} aria-labelledby="company-state-title" aria-describedby="company-state-description">
    <h2 id="company-state-title">Cambiar estado de empresa</h2>
    <p>{empresaReferencia.razonSocial}</p>
    <p id="company-state-description" className="admin-muted">Desactivar conserva el registro y sus relaciones. Reactivar permite volver a utilizarlo.</p>
    <div className="admin-form-actions">
      <button type="button" className="admin-button admin-danger" onClick={() => setPending(true)}>Desactivar</button>
      <button type="button" className="admin-button admin-outline" disabled={empresaReferencia.activa}>Reactivar</button>
    </div>
    {pending && <p className="admin-pending" role="status">La desactivación requiere conectar la API. El registro no cambió.</p>}
    <button type="button" className="admin-button admin-text-button" onClick={onClose}>Cancelar</button>
  </dialog>;
}

function CompanyList() {
  const [stateOpen, setStateOpen] = useState(false);
  // La confirmación se desmonta al cerrar: cada apertura empieza sin avisos previos.
  const [eliminacionAbierta, establecerEliminacionAbierta] = useState(false);
  return <>
    <PageHeading title="Empresas" description="Registra empresas y entrega el acceso a sus administradores." />
    <Link className="admin-button admin-create" to={`${base}/empresas/nueva`}>Registrar empresa</Link>
    <div className="admin-card admin-table-wrap">
      <table className="admin-table" aria-label="Empresas de referencia del diseño">
        <thead><tr><th scope="col">Empresa / RUC</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead>
        <tbody><tr>
          <td><span className="admin-record-name">{empresaReferencia.razonSocial}</span><span className="admin-record-key">{empresaReferencia.ruc}</span></td>
          <td>Activo</td>
          <td><div className="admin-row-actions">
            <Link className="admin-button admin-outline" to={`${base}/empresas/${empresaReferencia.id}`}>Ver</Link>
            <Link className="admin-button admin-outline" to={`${base}/empresas/${empresaReferencia.id}/editar`}>Editar</Link>
            <button type="button" className="admin-button admin-outline" onClick={() => setStateOpen(true)}>Estado</button>
            <button type="button" className="admin-button admin-delete-outline" onClick={() => establecerEliminacionAbierta(true)}>Eliminar</button>
          </div></td>
        </tr></tbody>
      </table>
    </div>
    <p className="admin-small admin-muted">1 registro de referencia</p>
    <PendingNotice />
    {stateOpen && <StateDialog onClose={() => setStateOpen(false)} />}
    {eliminacionAbierta && <DialogoEliminarEmpresa nombre={empresaReferencia.razonSocial} ruc={empresaReferencia.ruc} alCerrar={() => establecerEliminacionAbierta(false)} />}
  </>;
}

function CompanyDetail() {
  const [stateOpen, setStateOpen] = useState(false);
  const [eliminacionAbierta, establecerEliminacionAbierta] = useState(false);
  return <>
    <PageHeading title="Detalle de empresa" description="Consulta los datos y el estado del registro seleccionado." />
    <div className="admin-columns">
      <section className="admin-card admin-detail">
        {/* Reutiliza las etiquetas del formulario; nunca incluye la contraseña. */}
        <h2 className="admin-detail-heading">Datos de la empresa</h2>
        <dl>
          {camposEmpresa.map(campo => <div key={campo.clave}><dt>{campo.etiqueta}</dt><dd>{empresaReferencia[campo.clave]}</dd></div>)}
        </dl>
        <h2 className="admin-detail-heading">Cuenta del administrador</h2>
        <dl>
          {camposAdministrador.map(campo => <div key={campo.clave}><dt>{campo.etiqueta}</dt><dd>{empresaReferencia[campo.clave]}</dd></div>)}
        </dl>
        <div className="admin-form-actions">
          <Link className="admin-button admin-outline" to={`${base}/empresas`}>Volver</Link>
          <Link className="admin-button" to={`${base}/empresas/${empresaReferencia.id}/editar`}>Editar</Link>
        </div>
        {/* El borrado tiene su propia confirmación; no se confunde con cambiar el estado. */}
        <p className="admin-small admin-muted">Eliminar borra definitivamente; desactivar conserva la información.</p>
        <button type="button" className="admin-button admin-delete-outline" onClick={() => establecerEliminacionAbierta(true)}>Eliminar empresa</button>
      </section>
      <CompanyContext>
        <p>Activo</p>
        <button type="button" className="admin-button admin-outline" onClick={() => setStateOpen(true)}>Cambiar estado</button>
      </CompanyContext>
    </div>
    <PendingNotice />
    {stateOpen && <StateDialog onClose={() => setStateOpen(false)} />}
    {eliminacionAbierta && <DialogoEliminarEmpresa nombre={empresaReferencia.razonSocial} ruc={empresaReferencia.ruc} alCerrar={() => establecerEliminacionAbierta(false)} />}
  </>;
}

function PreviewLayout() {
  const location = useLocation();
  // Solo selecciona las pantallas de revisión. No sustituye los roles de la sesión.
  const companyView = location.pathname === companyPreviewPath || location.pathname.startsWith(`${companyPreviewPath}/`);
  return <div className="admin-preview">
    <div className="admin-preview-bar"><span>T059 · Vista previa de pantallas</span><div className="admin-preview-links"><Link to={companyView ? base : companyPreviewPath}>{companyView ? 'Revisar administración general' : 'Revisar administrador de empresa'}</Link><a href="/">Volver a la web</a></div></div>
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">Go Tacna</div>
        <p className="admin-profile">{companyView ? 'ANDINO DEMO · EMPRESA' : 'ADMINISTRACIÓN GENERAL'}</p>
        {companyView ? <nav aria-label="Administración de empresa">
          <NavLink to={companyPreviewPath} end><House size={20} aria-hidden="true" />Inicio</NavLink>
          <NavLink to={routesPreviewPath}><RouteIcon size={20} aria-hidden="true" />Rutas</NavLink>
          <NavLink to={rutaMicros}><BusFront size={20} aria-hidden="true" />Micros</NavLink>
          <NavLink to={rutaConductores}><Users size={20} aria-hidden="true" />Conductores</NavLink>
        </nav> : <nav aria-label="Administración general">
          <NavLink to={base} end><img src={busFront} width="20" height="20" alt="" />Inicio</NavLink>
          <NavLink to={`${base}/empresas`}><img src={busFront} width="20" height="20" alt="" />Empresas</NavLink>
        </nav>}
        {companyView && <div className="admin-sidebar-company"><Building2 size={20} aria-hidden="true" /><div><strong>Andino Demo</strong><span>Administrador de empresa</span></div></div>}
        {/* Solo abandona la vista previa; el cierre de sesión real espera integración. */}
        <a className="admin-button admin-outline admin-exit" href="/login">Salir de la vista</a>
      </aside>
      <main className="admin-main" id="admin-content">
        <div className="admin-session"><span>{companyView ? 'Empresa: Andino Demo / Tacna' : 'Go Tacna / Empresas registradas'}</span><span>{companyView ? 'Lucía · Administrador de empresa · Referencia' : 'María · Administrador general · Referencia'}</span></div>
        <Routes location={location}>
          {/* Las rutas exactas solo resuelven ejemplos conocidos; un ID desconocido cae en la pantalla no disponible. */}
          <Route path={rutaMicros} element={<ListadoMicros />} />
          <Route path={`${rutaMicros}/nuevo`} element={<FormularioMicro key="nuevo-micro" />} />
          <Route path={`${rutaMicros}/${microReferencia.id}`} element={<DetalleMicro />} />
          <Route path={`${rutaMicros}/${microReferencia.id}/editar`} element={<FormularioMicro key="editar-micro" editando />} />
          <Route path={rutaConductores} element={<ListadoConductores />} />
          <Route path={`${rutaConductores}/nuevo`} element={<FormularioConductor key="nuevo-conductor" />} />
          <Route path={`${rutaConductores}/${conductorReferencia.id}`} element={<DetalleConductor />} />
          <Route path={`${rutaConductores}/${conductorReferencia.id}/editar`} element={<FormularioConductor key="editar-conductor" editando />} />
          <Route path={companyPreviewPath} element={<CompanyHome />} />
          <Route path={routesPreviewPath} element={<RouteList />} />
          <Route path={`${routesPreviewPath}/nueva`} element={<RouteForm key="create-route" />} />
          <Route path={`${routesPreviewPath}/${referenceRoute.id}`} element={<RouteDetail />} />
          <Route path={`${routesPreviewPath}/${referenceRoute.id}/editar`} element={<RouteForm key="edit-route" editing />} />
          <Route path={base} element={<HomePage />} />
          <Route path={`${base}/empresas`} element={<CompanyList />} />
          <Route path={`${base}/empresas/nueva`} element={<FormularioEmpresa key="crear-empresa" />} />
          <Route path={`${base}/empresas/${empresaReferencia.id}`} element={<CompanyDetail />} />
          <Route path={`${base}/empresas/${empresaReferencia.id}/editar`} element={<FormularioEmpresa key="editar-empresa" editando />} />
          <Route path="*" element={<><PageHeading title="Pantalla no disponible" description="Vuelve al panel para continuar con la revisión." /><Link className="admin-button" to={base}>Ir al panel</Link></>} />
        </Routes>
      </main>
    </div>
  </div>;
}

export default function AdminPreview() {
  return <BrowserRouter><PreviewLayout /></BrowserRouter>;
}
