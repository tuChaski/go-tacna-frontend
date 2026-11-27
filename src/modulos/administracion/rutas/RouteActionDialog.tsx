import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { referenceRoute } from './route-reference';

interface RouteActionDialogProps {
  action: 'state' | 'delete';
  onClose: () => void;
}

/** Confirmaciones de diseño. El servidor decidirá si permite la operación. */
export function RouteActionDialog({ action, onClose }: RouteActionDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const deleting = action === 'delete';

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element?.showModal();
    // Cancelar recibe el foco inicial para evitar confirmar una eliminación por accidente.
    element?.querySelector<HTMLButtonElement>('[data-cancel]')?.focus();
    return () => {
      element?.close();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return <dialog className="admin-dialog" ref={dialog} onCancel={onClose}
    aria-labelledby="route-action-title" aria-describedby="route-action-description">
    <span className="admin-icon-tile admin-warning-icon"><AlertTriangle size={24} aria-hidden="true" /></span>
    <h2 id="route-action-title">{deleting ? '¿Eliminar esta ruta?' : 'Cambiar estado de ruta'}</h2>
    <p><strong>{referenceRoute.name}</strong> · {referenceRoute.trazado.length} puntos en el recorrido</p>
    <p id="route-action-description" className="admin-muted">{deleting
      ? 'Eliminar borrará la ruta definitivamente. Esta acción no se podrá deshacer. Si necesitas conservar su información, utiliza Desactivar.'
      : 'Desactivar conserva la información de la ruta. Puedes volver a activarla más adelante.'}</p>
    <div className="admin-form-actions">
      <button type="button" className="admin-button admin-outline" data-cancel onClick={onClose}>Cancelar</button>
      <button type="button" className="admin-button admin-danger" onClick={() => setPending(true)}>{deleting ? 'Eliminar definitivamente' : 'Desactivar'}</button>
    </div>
    {!deleting && <p className="admin-small admin-muted">La ruta de referencia está activa. Reactivar estará disponible cuando una ruta esté inactiva.</p>}
    {pending && <p className="admin-pending" role="status">{deleting
      ? 'La eliminación definitiva requiere conectar la API. No se eliminó la ruta.'
      : 'La desactivación requiere conectar la API. El estado de la ruta no cambió.'}</p>}
  </dialog>;
}
