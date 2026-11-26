/**
 * Punto de entrada al mantenimiento de Micros: localizar una unidad, consultar sus
 * asociaciones y abrir sus acciones. La búsqueda filtra un ejemplo inmutable;
 * cuando exista API, el catálogo y la paginación deberán proceder de ese servicio.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { PageHeading } from '../componentes/PageHeading';
import { PendingNotice } from '../componentes/PendingNotice';
import { normalizarBusqueda } from '../conductores/conductor-referencia';
import { conductoresReferencia, microReferencia, rutaMicros, rutasReferencia } from './micro-referencia';
import { DialogoMicro } from './DialogoMicro';

export function ListadoMicros() {
  const [busqueda, establecerBusqueda] = useState('');
  const [estado, establecerEstado] = useState('todos');
  const [accion, establecerAccion] = useState<'estado' | 'eliminar' | null>(null);
  const ruta = rutasReferencia.find(item => item.id === microReferencia.rutaId);
  const conductor = conductoresReferencia.find(item => item.id === microReferencia.conductorId);
  const texto = `${microReferencia.codigo} ${microReferencia.placa} ${ruta?.nombre ?? ''} ${conductor?.nombre ?? ''}`;
  const coincide = normalizarBusqueda(texto).includes(normalizarBusqueda(busqueda)) && estado !== 'inactivos';

  return (
    <>
      <PageHeading title="Micros" description="Organiza las unidades de Andino Demo y sus asignaciones." />
      <section className="admin-card admin-route-list" aria-label="Listado de micros">
        <div className="admin-list-heading">
          <div><h2>Unidades de la empresa</h2><p className="admin-small admin-muted">1 micro de referencia para revisar el diseño</p></div>
          <Link className="admin-button" to={`${rutaMicros}/nuevo`}><Plus size={20} aria-hidden="true" />Registrar micro</Link>
        </div>
        {/* La búsqueda incluye placa, código y nombres asociados para localizar la unidad. */}
        <div className="admin-list-filters">
          <div className="admin-field admin-search-field">
            <label htmlFor="micro-busqueda">Buscar micro</label>
            <div className="admin-input-wrap">
              <Search size={18} aria-hidden="true" />
              <input id="micro-busqueda" type="search" value={busqueda} placeholder="Código, placa, ruta o conductor"
                onChange={evento => establecerBusqueda(evento.target.value)} />
            </div>
          </div>
          <div className="admin-field">
            <label htmlFor="micro-estado">Estado</label>
            <select id="micro-estado" value={estado} onChange={evento => establecerEstado(evento.target.value)}>
              <option value="todos">Todos los estados</option><option value="activos">Activos</option><option value="inactivos">Inactivos</option>
            </select>
          </div>
        </div>
        {/* El estado administrativo no equivale al estado GPS ni indica que esté en servicio. */}
        {coincide ? (
          <div className="admin-table-wrap">
            <table className="admin-table admin-routes-table" aria-label="Micros de referencia">
              <thead><tr><th scope="col">Micro y asignación</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead>
              <tbody><tr>
                <td>
                  <span className="admin-record-name">{microReferencia.codigo} · {microReferencia.placa}</span>
                  <span className="admin-record-key">Ruta: {ruta?.nombre}</span>
                  <span className="admin-record-key">Conductor: {conductor?.nombre || 'Sin asignar'}</span>
                </td>
                <td><span className="admin-status-badge">Activo</span></td>
                <td><div className="admin-row-actions">
                  <Link className="admin-button admin-outline" to={`${rutaMicros}/${microReferencia.id}`}><Eye size={16} aria-hidden="true" />Ver</Link>
                  <Link className="admin-button admin-outline" to={`${rutaMicros}/${microReferencia.id}/editar`}><Pencil size={16} aria-hidden="true" />Editar</Link>
                  <button type="button" className="admin-button admin-outline" onClick={() => establecerAccion('estado')}><SlidersHorizontal size={16} aria-hidden="true" />Estado</button>
                  <button type="button" className="admin-button admin-delete-outline" onClick={() => establecerAccion('eliminar')}><Trash2 size={16} aria-hidden="true" />Eliminar</button>
                </div></td>
              </tr></tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state">
            <Search size={28} aria-hidden="true" /><h2>No hay coincidencias</h2>
            <p className="admin-muted">Prueba otra búsqueda o cambia el filtro de estado.</p>
            <button type="button" className="admin-button admin-outline" onClick={() => { establecerBusqueda(''); establecerEstado('todos'); }}>Limpiar filtros</button>
          </div>
        )}
        <p className="admin-small admin-muted" role="status">{coincide ? '1 micro encontrado' : '0 micros encontrados'}</p>
      </section>
      <PendingNotice />
      {accion && <DialogoMicro accion={accion} alCerrar={() => establecerAccion(null)} />}
    </>
  );
}
