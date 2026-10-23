/** Confirmación de una escritura real. Contiene el foco, espera al servidor y
 * conserva el diálogo ante errores; cerrar nunca se interpreta como éxito.
 */
import { useEffect, useRef, useState } from 'react';
import { errorAdministracion } from '../../../services/administracion';

export function DialogoOperacion({ titulo, descripcion, estados, estadoInicial, alConfirmar, alCerrar }: {
  titulo: string; descripcion: string; estados?: { valor: string; nombre: string }[];
  estadoInicial: string; alConfirmar: (estado: string) => Promise<void>; alCerrar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const bloqueo = useRef(false);
  const [ocupado, establecerOcupado] = useState(false);
  const [error, establecerError] = useState('');
  const [estado, establecerEstado] = useState(estadoInicial);
  useEffect(() => {
    const elemento = dialogo.current;
    const anterior = document.activeElement;
    elemento?.showModal(); elemento?.querySelector<HTMLButtonElement>('[data-cancelar]')?.focus();
    return () => { elemento?.close(); if (anterior instanceof HTMLElement) anterior.focus(); };
  }, []);
  async function confirmar() {
    if (bloqueo.current) return;
    bloqueo.current = true; establecerOcupado(true); establecerError('');
    try { await alConfirmar(estado); }
    catch (fallo) { establecerError(errorAdministracion(fallo).message); }
    finally { bloqueo.current = false; establecerOcupado(false); }
  }
  return <dialog className="admin-dialog" ref={dialogo} aria-labelledby="operacion-titulo" aria-describedby="operacion-descripcion"
    onCancel={evento => { if (bloqueo.current) evento.preventDefault(); else alCerrar(); }}>
    <h2 id="operacion-titulo">{titulo}</h2><p id="operacion-descripcion">{descripcion}</p>
    {estados && <div className="admin-field"><label htmlFor="nuevo-estado">Nuevo estado</label><select id="nuevo-estado" value={estado} disabled={ocupado}
      onChange={evento => establecerEstado(evento.target.value)}>{estados.map(opcion => <option key={opcion.valor} value={opcion.valor}>{opcion.nombre}</option>)}</select></div>}
    {error && <p role="alert" className="admin-error-servicio">{error}</p>}
    <div className="admin-form-actions"><button type="button" data-cancelar className="admin-button admin-outline" disabled={ocupado} onClick={alCerrar}>Cancelar</button>
      <button type="button" className="admin-button admin-danger" disabled={ocupado} onClick={() => void confirmar()}>{ocupado ? 'Procesando…' : estados ? 'Confirmar estado' : 'Eliminar definitivamente'}</button></div>
  </dialog>;
}
