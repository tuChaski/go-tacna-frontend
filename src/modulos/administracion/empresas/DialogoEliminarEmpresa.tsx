/**
 * Confirmación compartida por el listado y el detalle de Empresas.
 * Identifica la empresa y distingue el borrado definitivo de la desactivación.
 * Solo prepara la interacción: no elimina registros ni presupone borrado en cascada.
 */
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Propiedades {
  nombre: string;
  ruc: string;
  alCerrar: () => void;
}

export function DialogoEliminarEmpresa({ nombre, ruc, alCerrar }: Propiedades) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [pendiente, establecerPendiente] = useState(false);

  // El diálogo nativo contiene el foco. Cancelar es la primera acción enfocada;
  // al cerrar o desmontar, el teclado vuelve al botón que abrió la confirmación.
  useEffect(() => {
    const elemento = dialogo.current;
    const origen = document.activeElement;
    elemento?.showModal();
    elemento?.querySelector<HTMLButtonElement>('[data-cancelar]')?.focus();
    return () => {
      elemento?.close();
      if (origen instanceof HTMLElement) origen.focus();
    };
  }, []);

  return (
    <dialog className="admin-dialog" ref={dialogo} onCancel={alCerrar}
      aria-labelledby="empresa-eliminar-titulo" aria-describedby="empresa-eliminar-descripcion">
      <span className="admin-icon-tile admin-warning-icon"><AlertTriangle size={24} aria-hidden="true" /></span>
      <h2 id="empresa-eliminar-titulo">¿Eliminar esta empresa?</h2>
      <p><strong>{nombre}</strong> · RUC: {ruc}</p>
      <p id="empresa-eliminar-descripcion" className="admin-muted">
        Eliminar borrará la empresa definitivamente. Esta acción no se podrá deshacer.
        Para conservar su información, utiliza Desactivar.
      </p>
      {/* Las consecuencias sobre relaciones requieren una política acordada con backend. */}
      <p className="admin-small admin-muted">
        Las restricciones por cuentas, rutas, micros y conductores asociados están pendientes de definir.
      </p>
      <div className="admin-form-actions">
        <button type="button" className="admin-button admin-outline" data-cancelar onClick={alCerrar}>Cancelar</button>
        <button type="button" className="admin-button admin-danger" onClick={() => establecerPendiente(true)}>
          Eliminar definitivamente
        </button>
      </div>
      {/* Punto de integración futuro: solo una respuesta real podrá confirmar el borrado. */}
      {pendiente && <p className="admin-pending" role="status">
        La eliminación requiere conectar la API. No se eliminó la empresa ni se modificaron sus cuentas o registros asociados.
      </p>}
    </dialog>
  );
}
