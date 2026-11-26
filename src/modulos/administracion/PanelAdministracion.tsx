/** Panel autenticado. La administración general gestiona empresas y sus cuentas;
 * la de empresa trabaja únicamente sobre los IDs vinculados a su sesión. La API
 * valida nuevamente el alcance, incluso si se manipulan URLs o identificadores.
 */
import { useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { Building2, BusFront, Route as IconoRuta, Users } from 'lucide-react';
import type { User } from '../../types/auth';
import { GestionRecurso } from './GestionRecurso';
import type { Recurso } from './datos-administracion';
import '@fontsource-variable/inter';
import './admin.css';

export function PanelAdministracion({ usuario, saliendo, alSalir }: { usuario: User; saliendo: boolean; alSalir: () => void }) {
  const general = usuario.rol === 'admin_general';
  const [seleccionada, establecerSeleccionada] = useState(usuario.empresas.length === 1 ? String(usuario.empresas[0].id) : '');
  const empresa = usuario.empresas.find(item => String(item.id) === seleccionada);
  const navegar = useNavigate();
  const raiz = general ? '/admin' : '/admin/empresa';
  const modulos: { recurso: Recurso; nombre: string; icono: typeof Building2 }[] = general
    ? [{ recurso: 'empresas', nombre: 'Empresas', icono: Building2 }]
    : [{ recurso: 'rutas', nombre: 'Rutas', icono: IconoRuta }, { recurso: 'conductores', nombre: 'Conductores', icono: Users }, { recurso: 'micros', nombre: 'Micros', icono: BusFront }];
  return <div className="admin-preview">
    <div className="admin-shell">
      <aside className="admin-sidebar"><Link className="admin-brand" to={raiz}>Go Tacna</Link><p className="admin-profile">{general ? 'ADMINISTRACIÓN GENERAL' : 'ADMINISTRACIÓN DE EMPRESA'}</p>
        <nav aria-label="Módulos administrativos">{modulos.map(modulo => <NavLink key={modulo.recurso} to={`${raiz}/${modulo.recurso}`}><modulo.icono size={20} aria-hidden="true" />{modulo.nombre}</NavLink>)}</nav>
        <button className="admin-button admin-outline admin-exit" disabled={saliendo} onClick={alSalir}>{saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}</button>
      </aside>
      <main className="admin-main" id="panel-administrativo">
        <div className="admin-session"><span>{general ? 'Gestión de empresas y cuentas administrativas' : empresa?.razonSocial ?? 'Selecciona una empresa'}</span><span>{usuario.nombre} {usuario.apellido}</span></div>
        {!general && <div className="admin-card admin-field"><label htmlFor="empresa-autorizada">Empresa que vas a gestionar</label>
          <select id="empresa-autorizada" value={seleccionada} onChange={evento => { establecerSeleccionada(evento.target.value); navegar(`${raiz}/rutas`); }}>
            <option value="">Selecciona una empresa</option>{usuario.empresas.map(item => <option key={item.id} value={item.id}>{item.razonSocial}</option>)}
          </select></div>}
        {!general && !empresa ? <p className="admin-card">{usuario.empresas.length ? 'Selecciona una de tus empresas autorizadas para consultar y modificar sus registros.' : 'No tienes empresas vinculadas. Contacta al administrador general.'}</p>
          : <Routes key={general ? 'general' : empresa?.id}>
            <Route index element={<Navigate to={`${raiz}/${general ? 'empresas' : 'rutas'}`} replace />} />
            {modulos.map(({ recurso }) => {
              const base = `${raiz}/${recurso}`;
              const vista = (modo: 'lista' | 'nuevo' | 'detalle' | 'editar' | 'cuentaNueva' | 'cuentaEditar') => <GestionRecurso key={`${recurso}-${modo}`} recurso={recurso} modo={modo} base={base} empresaId={empresa?.id} />;
              return <Route key={recurso}>
                <Route path={recurso} element={vista('lista')} />
                <Route path={`${recurso}/nuevo`} element={vista('nuevo')} />
                <Route path={`${recurso}/:id`} element={vista('detalle')} />
                <Route path={`${recurso}/:id/editar`} element={vista('editar')} />
                {general && <><Route path={`${recurso}/:id/cuentas/nueva`} element={vista('cuentaNueva')} /><Route path={`${recurso}/:id/cuentas/:usuarioId/editar`} element={vista('cuentaEditar')} /></>}
              </Route>;
            })}
            <Route path="*" element={<section className="admin-card"><h1>Página no disponible</h1><Link to={raiz}>Volver al panel</Link></section>} />
          </Routes>}
      </main>
    </div>
  </div>;
}
