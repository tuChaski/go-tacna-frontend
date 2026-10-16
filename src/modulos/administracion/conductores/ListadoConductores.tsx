/** Listado de revisión con búsqueda local, filtro de estado y acceso a las acciones. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { PageHeading } from '../componentes/PageHeading';
import { PendingNotice } from '../componentes/PendingNotice';
import { conductorReferencia, normalizarBusqueda, rutaConductores } from './conductor-referencia';
import { DialogoConductor } from './DialogoConductor';

export function ListadoConductores() {
  const [busqueda, establecerBusqueda] = useState('');
  const [estado, establecerEstado] = useState('todos');
  const [accion, establecerAccion] = useState<'estado' | 'eliminar' | null>(null);
  const conductor = conductorReferencia;

  // No consulta el servidor: filtra únicamente el ejemplo identificado como referencia.
  const texto = normalizarBusqueda(`${conductor.nombreCompleto} ${conductor.documento} ${conductor.correo}`);
  const coincide = texto.includes(normalizarBusqueda(busqueda)) && estado !== 'inactivos';

  function limpiarFiltros() {
    establecerBusqueda('');
    establecerEstado('todos');
  }

  return (
    <>
      <PageHeading title="Conductores" description="Gestiona los datos y accesos de los conductores de Andino Demo." />
      <section className="admin-card admin-route-list" aria-label="Listado de conductores">
        <div className="admin-list-heading">
          <div>
            <h2>Conductores de la empresa</h2>
            <p className="admin-small admin-muted">1 conductor de referencia para revisar el diseño</p>
          </div>
          <Link className="admin-button" to={`${rutaConductores}/nuevo`}>
            <Plus size={20} aria-hidden="true" />Registrar conductor
          </Link>
        </div>

        {/* Los filtros tienen etiquetas visibles y un botón para recuperar el listado. */}
        <div className="admin-list-filters">
          <div className="admin-field admin-search-field">
            <label htmlFor="conductor-busqueda">Buscar conductor</label>
            <div className="admin-input-wrap">
              <Search size={18} aria-hidden="true" />
              <input
                id="conductor-busqueda" type="search" placeholder="Nombre, documento o correo"
                value={busqueda} onChange={evento => establecerBusqueda(evento.target.value)}
              />
            </div>
          </div>
          <div className="admin-field">
            <label htmlFor="conductor-estado">Estado</label>
            <select id="conductor-estado" value={estado} onChange={evento => establecerEstado(evento.target.value)}>
              <option value="todos">Todos los estados</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>
          </div>
        </div>

        {/* Se reutiliza la tabla adaptable de Rutas; en móvil se muestra como ficha. */}
        {coincide ? (
          <div className="admin-table-wrap">
            <table className="admin-table admin-routes-table" aria-label="Conductores de referencia">
              <thead><tr><th scope="col">Conductor y acceso</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead>
              <tbody>
                <tr>
                  <td>
                    <span className="admin-record-name">{conductor.nombreCompleto}</span>
                    <span className="admin-record-key">{conductor.documento}</span>
                    <span className="admin-record-key">{conductor.correo}</span>
                  </td>
                  <td><span className="admin-status-badge">Activo</span></td>
                  <td>
                    <div className="admin-row-actions">
                      <Link className="admin-button admin-outline" to={`${rutaConductores}/${conductor.id}`}><Eye size={16} aria-hidden="true" />Ver</Link>
                      <Link className="admin-button admin-outline" to={`${rutaConductores}/${conductor.id}/editar`}><Pencil size={16} aria-hidden="true" />Editar</Link>
                      <button type="button" className="admin-button admin-outline" onClick={() => establecerAccion('estado')}><SlidersHorizontal size={16} aria-hidden="true" />Estado</button>
                      <button type="button" className="admin-button admin-delete-outline" onClick={() => establecerAccion('eliminar')}><Trash2 size={16} aria-hidden="true" />Eliminar</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state">
            <Search size={28} aria-hidden="true" />
            <h2>No hay coincidencias</h2>
            <p className="admin-muted">Prueba otra búsqueda o cambia el filtro de estado.</p>
            <button type="button" className="admin-button admin-outline" onClick={limpiarFiltros}>Limpiar filtros</button>
          </div>
        )}
        <p className="admin-small admin-muted" role="status">{coincide ? '1 conductor encontrado' : '0 conductores encontrados'}</p>
      </section>
      <PendingNotice />
      {accion && <DialogoConductor accion={accion} alCerrar={() => establecerAccion(null)} />}
    </>
  );
}
