/**
 * Resume lo seleccionado antes de guardar, sin confundir registro con operación GPS.
 * Recibe el formulario por props: al escribir no modifica los catálogos ni las asociaciones.
 */
import { BusFront, Info, UserRound } from 'lucide-react';
import type { DatosMicro } from './formulario-micro';
import { conductoresReferencia, rutasReferencia } from './micro-referencia';

export function ContextoMicro({ datos }: { datos: DatosMicro }) {
  const ruta = rutasReferencia.find(item => item.id === datos.rutaId);
  const conductor = conductoresReferencia.find(item => item.id === datos.conductorId);
  return (
    <aside className="admin-card admin-context" aria-label="Resumen del micro">
      <span className="admin-icon-tile"><BusFront size={24} aria-hidden="true" /></span>
      <h2>{datos.codigo.trim() || 'Tu nuevo micro'}</h2>
      <p className="admin-muted">Empresa: Andino Demo</p>
      <dl className="admin-assignment-summary">
        <dt>Placa</dt><dd>{datos.placa.trim() || 'Por completar'}</dd>
        <dt>Ruta seleccionada</dt><dd>{ruta?.nombre || 'Por seleccionar'}</dd>
        <dt>Conductor seleccionado</dt><dd>{conductor?.nombre || 'Sin conductor asignado'}</dd>
      </dl>
      <div className="admin-info-note">
        <UserRound size={20} aria-hidden="true" />
        <p>Puedes registrar el micro sin conductor. Cada conductor puede tener un solo micro asignado a la vez.</p>
      </div>
      <div className="admin-info-note">
        <Info size={20} aria-hidden="true" />
        <p>Registrar el micro no activa su GPS ni inicia un recorrido. Para cambiar una asignación durante un recorrido, primero debe finalizarse.</p>
      </div>
    </aside>
  );
}
