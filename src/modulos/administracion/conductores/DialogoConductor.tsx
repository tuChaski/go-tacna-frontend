/** Confirma cambios de estado o borrado definitivo sin alterar los datos de referencia. */
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { conductorReferencia } from './conductor-referencia';

interface PropiedadesDialogo {
  accion: 'estado' | 'eliminar';
  alCerrar: () => void;
}

export function DialogoConductor({ accion, alCerrar }: PropiedadesDialogo) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [pendiente, establecerPendiente] = useState(false);
  const eliminando = accion === 'eliminar';

  // El diálogo nativo mantiene el foco dentro; al cerrar se vuelve al botón de origen.
  useEffect(() => {
    const elemento = dialogo.current;
    const focoAnterior = document.activeElement;
    elemento?.showModal();
    elemento?.querySelector<HTMLButtonElement>('[data-cancelar]')?.focus();
    return () => {
      elemento?.close();
      if (focoAnterior instanceof HTMLElement) focoAnterior.focus();
    };
  }, []);

  return (
    <dialog
      className="admin-dialog"
      ref={dialogo}
      onCancel={alCerrar}
      aria-labelledby="conductor-accion-titulo"
      aria-describedby="conductor-accion-descripcion"
    >
      <span className="admin-icon-tile admin-warning-icon"><AlertTriangle size={24} aria-hidden="true" /></span>
      <h2 id="conductor-accion-titulo">{eliminando ? '¿Eliminar este conductor?' : 'Cambiar estado de conductor'}</h2>
      <p><strong>{conductorReferencia.nombreCompleto}</strong> · {conductorReferencia.documento}</p>
      <p id="conductor-accion-descripcion" className="admin-muted">
        {eliminando
          ? 'Eliminar borrará el registro del conductor definitivamente. Esta acción no se podrá deshacer. Para conservar su información, utiliza Desactivar.'
          : 'Desactivar conserva la información del conductor. Puedes volver a activarlo más adelante.'}
      </p>

      {/* La confirmación es visual: las restricciones por cuentas y micros corresponden al backend. */}
      <div className="admin-form-actions">
        <button type="button" className="admin-button admin-outline" data-cancelar onClick={alCerrar}>Cancelar</button>
        <button type="button" className="admin-button admin-danger" onClick={() => establecerPendiente(true)}>
          {eliminando ? 'Eliminar definitivamente' : 'Desactivar'}
        </button>
      </div>
      {!eliminando && (
        <p className="admin-small admin-muted">El conductor de referencia está activo. Reactivar estará disponible para conductores inactivos.</p>
      )}
      {pendiente && (
        <p className="admin-pending" role="status">
          {eliminando
            ? 'La eliminación definitiva requiere conectar la API. No se eliminó el conductor ni su cuenta.'
            : 'La desactivación requiere conectar la API. El estado del conductor no cambió.'}
        </p>
      )}
    </dialog>
  );
}
