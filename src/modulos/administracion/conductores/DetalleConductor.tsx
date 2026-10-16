/** Consulta los datos públicos del registro, sin recuperar ni mostrar su contraseña. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { PageHeading } from '../componentes/PageHeading';
import { PendingNotice } from '../componentes/PendingNotice';
import { ContextoConductor } from './ContextoConductor';
import { DialogoConductor } from './DialogoConductor';
import { conductorReferencia, rutaConductores } from './conductor-referencia';
import { camposDatosConductor } from './formulario-conductor';
import { microReferencia, rutaMicros } from '../micros/micro-referencia';

export function DetalleConductor() {
  const [accion, establecerAccion] = useState<'estado' | 'eliminar' | null>(null);
  const conductor = conductorReferencia;

  return (
    <>
      <Link className="admin-back-link" to={rutaConductores}><ArrowLeft size={18} aria-hidden="true" />Volver a conductores</Link>
      <PageHeading title={conductor.nombreCompleto} description="Consulta los datos de acceso y el estado del conductor." />
      <div className="admin-columns">
        <section className="admin-card admin-detail">
          <div className="admin-detail-heading"><h2>Datos del conductor</h2><span className="admin-status-badge">Activo</span></div>
          <dl>
            {camposDatosConductor.map(campo => (
              <div key={campo.clave}><dt>{campo.etiqueta}</dt><dd>{conductor[campo.clave]}</dd></div>
            ))}
            <div><dt>Empresa</dt><dd>Andino Demo</dd></div>
          </dl>

          {/* Comparte el escenario de T053 con Micros. Es una referencia visual, no una consulta real. */}
          <p className="admin-pending">Micro asignado en este ejemplo: <Link to={`${rutaMicros}/${microReferencia.id}`}>{microReferencia.codigo}</Link>. La asignación real requiere la API.</p>
          <div className="admin-form-actions admin-conductor-actions">
            <button type="button" className="admin-button admin-outline" onClick={() => establecerAccion('estado')}>Cambiar estado</button>
            <Link className="admin-button" to={`${rutaConductores}/${conductor.id}/editar`}><Pencil size={18} aria-hidden="true" />Editar conductor</Link>
          </div>
          <div className="admin-delete-section">
            <p className="admin-small admin-muted">Eliminar borra definitivamente; desactivar conserva la información.</p>
            <button type="button" className="admin-button admin-delete-outline" onClick={() => establecerAccion('eliminar')}><Trash2 size={18} aria-hidden="true" />Eliminar conductor</button>
          </div>
        </section>
        <ContextoConductor nombre={conductor.nombreCompleto} />
      </div>
      <PendingNotice />
      {accion && <DialogoConductor accion={accion} alCerrar={() => establecerAccion(null)} />}
    </>
  );
}
