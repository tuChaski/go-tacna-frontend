import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { PageHeading } from '../components/PageHeading';
import { PendingNotice } from '../components/PendingNotice';
import { RouteActionDialog } from './RouteActionDialog';
import { referenceRoute, routesPreviewPath } from './route-reference';

export function RouteList() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [action, setAction] = useState<'state' | 'delete' | null>(null);
  // Búsqueda solo sobre la referencia visual; luego se conectará al listado real.
  const searchable = `${referenceRoute.name} ${referenceRoute.originDestination}`.toLocaleLowerCase('es');
  const matches = searchable.includes(query.trim().toLocaleLowerCase('es')) && status !== 'inactive';

  return <>
    <PageHeading title="Rutas" description="Organiza los recorridos de Andino Demo y consulta sus puntos de referencia." />
    <section className="admin-card admin-route-list" aria-label="Listado de rutas">
      <div className="admin-list-heading">
        <div><h2>Recorridos de la empresa</h2><p className="admin-small admin-muted">1 ruta de referencia para revisar el diseño</p></div>
        <Link className="admin-button" to={`${routesPreviewPath}/nueva`}><Plus size={20} aria-hidden="true" />Registrar ruta</Link>
      </div>
      <div className="admin-list-filters">
        <div className="admin-field admin-search-field">
          <label htmlFor="route-search">Buscar ruta</label>
          <div className="admin-input-wrap"><Search size={18} aria-hidden="true" /><input id="route-search" type="search" placeholder="Nombre, origen o destino" value={query} onChange={event => setQuery(event.target.value)} /></div>
        </div>
        <div className="admin-field"><label htmlFor="route-status">Estado</label><select id="route-status" value={status} onChange={event => setStatus(event.target.value)}><option value="all">Todos los estados</option><option value="active">Activas</option><option value="inactive">Inactivas</option></select></div>
      </div>
      {matches ? <div className="admin-table-wrap">
        <table className="admin-table admin-routes-table" aria-label="Rutas de referencia">
          <thead><tr><th scope="col">Ruta y recorrido</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead>
          <tbody><tr>
            <td><span className="admin-record-name">{referenceRoute.name}</span><span className="admin-record-key">{referenceRoute.originDestination}</span></td>
            <td><span className="admin-status-badge">Activa</span></td>
            <td><div className="admin-row-actions">
              <Link className="admin-button admin-outline" to={`${routesPreviewPath}/${referenceRoute.id}`}><Eye size={16} aria-hidden="true" />Ver</Link>
              <Link className="admin-button admin-outline" to={`${routesPreviewPath}/${referenceRoute.id}/editar`}><Pencil size={16} aria-hidden="true" />Editar</Link>
              <button type="button" className="admin-button admin-outline" onClick={() => setAction('state')}><SlidersHorizontal size={16} aria-hidden="true" />Estado</button>
              <button type="button" className="admin-button admin-delete-outline" onClick={() => setAction('delete')}><Trash2 size={16} aria-hidden="true" />Eliminar</button>
            </div></td>
          </tr></tbody>
        </table>
      </div> : <div className="admin-empty-state"><Search size={28} aria-hidden="true" /><h2>No hay coincidencias</h2><p className="admin-muted">Prueba otro nombre o cambia el filtro de estado.</p><button type="button" className="admin-button admin-outline" onClick={() => { setQuery(''); setStatus('all'); }}>Limpiar filtros</button></div>}
      <p className="admin-small admin-muted" role="status">{matches ? '1 ruta encontrada' : '0 rutas encontradas'}</p>
    </section>
    <PendingNotice />
    {action && <RouteActionDialog action={action} onClose={() => setAction(null)} />}
  </>;
}
