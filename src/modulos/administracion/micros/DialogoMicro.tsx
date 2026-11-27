/**
 * Confirmación de estado o eliminación de una unidad. Identifica el registro y
 * diferencia conservar información de borrar definitivamente. No ejecuta operaciones
 * en cuentas, rutas o conductores: sus dependencias se resolverán con el backend.
 */
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { microReferencia } from './micro-referencia';

export function DialogoMicro({ accion, alCerrar }: { accion: 'estado' | 'eliminar'; alCerrar: () => void }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [pendiente, establecerPendiente] = useState(false);
  const eliminando = accion === 'eliminar';

  // Cancelar recibe el foco inicial. El diálogo nativo lo contiene y Escape cierra;
  // la limpieza restaura el control de origen, incluso al desmontar la pantalla.
  useEffect(() => {
    const elemento = dialogo.current;
    const anterior = document.activeElement;
    elemento?.showModal();
    elemento?.querySelector<HTMLButtonElement>('[data-cancelar]')?.focus();
    return () => {
      elemento?.close();
      if (anterior instanceof HTMLElement) anterior.focus();
    };
  }, []);

  return (
    <dialog className="admin-dialog" ref={dialogo} onCancel={alCerrar}
      aria-labelledby="micro-accion-titulo" aria-describedby="micro-accion-descripcion">
      <span className="admin-icon-tile admin-warning-icon"><AlertTriangle size={24} aria-hidden="true" /></span>
      <h2 id="micro-accion-titulo">{eliminando ? '¿Eliminar este micro?' : 'Cambiar estado de micro'}</h2>
      <p><strong>{microReferencia.codigo}</strong> · {microReferencia.placa}</p>
      <p id="micro-accion-descripcion" className="admin-muted">
        {eliminando
          ? 'Eliminar borrará el micro definitivamente. Esta acción no se podrá deshacer. Para conservar su información, utiliza Desactivar.'
          : 'Desactivar conserva la información del micro. Puedes volver a activarlo más adelante.'}
      </p>
      <div className="admin-form-actions">
        <button type="button" className="admin-button admin-outline" data-cancelar onClick={alCerrar}>Cancelar</button>
        <button type="button" className="admin-button admin-danger" onClick={() => establecerPendiente(true)}>
          {eliminando ? 'Eliminar definitivamente' : 'Desactivar'}
        </button>
      </div>
      {!eliminando && <p className="admin-small admin-muted">El micro de referencia está activo. Reactivar estará disponible para micros inactivos.</p>}
      {/* Es un aviso de integración, no una respuesta de éxito ni una eliminación local. */}
      {pendiente && <p className="admin-pending" role="status">
        {eliminando ? 'La eliminación requiere conectar la API. No se eliminó el micro ni se alteraron sus asociaciones.' : 'La desactivación requiere conectar la API. El estado del micro no cambió.'}
      </p>}
    </dialog>
  );
}
