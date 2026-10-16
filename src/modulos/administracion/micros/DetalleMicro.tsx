/**
 * Consulta de una unidad y sus asociaciones de referencia. Los enlaces permiten
 * inspeccionar ruta/conductor sin duplicar sus formularios. La asignación se edita
 * exclusivamente en Micros, evitando dos puntos de escritura para la misma relación.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { PageHeading } from '../componentes/PageHeading';
import { PendingNotice } from '../componentes/PendingNotice';
import { rutaConductores } from '../conductores/conductor-referencia';
import { routesPreviewPath } from '../rutas/route-reference';
import { ContextoMicro } from './ContextoMicro';
import { DialogoMicro } from './DialogoMicro';
import { microReferencia, rutaMicros, conductoresReferencia, rutasReferencia } from './micro-referencia';

export function DetalleMicro() {
  const [accion, establecerAccion] = useState<'estado' | 'eliminar' | null>(null);
  const micro = microReferencia;
  const ruta = rutasReferencia.find(item => item.id === micro.rutaId);
  const conductor = conductoresReferencia.find(item => item.id === micro.conductorId);
  return (
    <>
      <Link className="admin-back-link" to={rutaMicros}><ArrowLeft size={18} aria-hidden="true" />Volver a micros</Link>
      <PageHeading title={micro.codigo} description="Consulta la identificación y las asociaciones de esta unidad." />
      <div className="admin-columns">
        <section className="admin-card admin-detail">
          <div className="admin-detail-heading"><h2>Datos del micro</h2><span className="admin-status-badge">Activo</span></div>
          <dl>
            <div><dt>Código del micro</dt><dd>{micro.codigo}</dd></div>
            <div><dt>Placa</dt><dd>{micro.placa}</dd></div>
            <div><dt>Empresa</dt><dd>Andino Demo</dd></div>
            <div><dt>Ruta asignada</dt><dd><Link className="admin-back-link" to={`${routesPreviewPath}/${micro.rutaId}`}>{ruta?.nombre}</Link></dd></div>
            <div><dt>Conductor asignado</dt><dd>{conductor ? <Link className="admin-back-link" to={`${rutaConductores}/${conductor.id}`}>{conductor.nombre}</Link> : 'Sin asignar'}</dd></div>
          </dl>
          <div className="admin-form-actions">
            <button type="button" className="admin-button admin-outline" onClick={() => establecerAccion('estado')}>Cambiar estado</button>
            <Link className="admin-button" to={`${rutaMicros}/${micro.id}/editar`}><Pencil size={18} aria-hidden="true" />Editar micro</Link>
          </div>
          <div className="admin-delete-section">
            <p className="admin-small admin-muted">Eliminar borra definitivamente; desactivar conserva la información.</p>
            <button type="button" className="admin-button admin-delete-outline" onClick={() => establecerAccion('eliminar')}><Trash2 size={18} aria-hidden="true" />Eliminar micro</button>
          </div>
        </section>
        <ContextoMicro datos={micro} />
      </div>
      <PendingNotice />
      {accion && <DialogoMicro accion={accion} alCerrar={() => establecerAccion(null)} />}
    </>
  );
}
