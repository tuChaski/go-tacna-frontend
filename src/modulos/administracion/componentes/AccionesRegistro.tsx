/** Acciones de fila compartidas por ambos administradores. El servidor confirma
 * cada escritura y sigue comprobando la empresa, las asignaciones y los permisos.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Power, Trash2 } from 'lucide-react';
import { cambiarEstadoRegistro, eliminarRegistro } from '../../../services/administracion';
import { estadoRegistro, opcionesEstadoOperativo, tituloRegistro } from '../datos-administracion';
import type { Recurso, RegistroAdministrativo } from '../datos-administracion';
import { DialogoOperacion } from './DialogoOperacion';

export function AccionesRegistro({ recurso, registro, base, alCompletar }: {
  recurso: Recurso; registro: RegistroAdministrativo; base: string;
  alCompletar: (resultado: { eliminado: boolean; aviso: string }) => void;
}) {
  const [accion, establecerAccion] = useState<'estado' | 'eliminar' | null>(null);
  const vigente = useRef(true);
  useEffect(() => { vigente.current = true; return () => { vigente.current = false; }; }, []);
  const nombre = tituloRegistro(recurso, registro);
  const binario = recurso === 'empresas' || recurso === 'rutas';
  const activo = registro.activo === true;
  const cambio = binario ? activo ? 'Desactivar' : 'Activar' : 'Cambiar estado operativo';
  const eliminando = accion === 'eliminar';
  const descripcionesEliminar: Record<Recurso, string> = {
    empresas: 'La eliminación es definitiva. Si esta empresa tiene cuentas administrativas, rutas, micros o conductores vinculados, el sistema impedirá eliminarla.',
    rutas: 'La eliminación es definitiva. Si esta ruta tiene micros asignados, primero debes resolver esas asignaciones.',
    micros: 'La eliminación es definitiva. No se puede eliminar un micro que está en recorrido.',
    conductores: 'Se eliminará el perfil de conductor, no su cuenta de usuario. Primero debes desasignar el micro si tiene uno vinculado.',
  };
  const descripcionEstado = binario
    ? `El registro quedará ${activo ? 'inactivo' : 'activo'}. Sus datos y asociaciones se conservarán.`
    : recurso === 'conductores' ? 'Cambia la disponibilidad operativa del conductor. Esto no activa ni desactiva su cuenta de usuario.'
      : 'Selecciona el estado operativo del micro. Si tiene conductor asignado, el servidor también actualizará su estado operativo.';
  // Bloqueos que el servidor rechazaría con 409; se anticipan con los datos del listado.
  const microsAsignados = registro.micros_count ?? 0;
  const bloqueoEliminar = recurso === 'conductores' && registro.micro_actual
    ? `No se puede eliminar: tiene asignado el micro ${registro.micro_actual.placa}. Primero desasígnalo.`
    : recurso === 'micros' && registro.estado === 'en_recorrido'
      ? 'No se puede eliminar un micro que está en recorrido. Finaliza el recorrido primero.'
      : recurso === 'rutas' && microsAsignados > 0
        ? `No se puede eliminar: la ruta tiene ${microsAsignados} ${microsAsignados === 1 ? 'micro asignado' : 'micros asignados'}.`
        : '';

  return <>
    <div className="admin-row-actions admin-record-actions" role="group" aria-label={`Acciones de ${nombre}`}>
      <Link className="admin-button admin-outline" to={`${base}/${registro.id}`} aria-label={`Ver ${nombre}`}>
        <Eye size={16} aria-hidden="true" />Ver
      </Link>
      <Link className="admin-button admin-outline" to={`${base}/${registro.id}/editar`} aria-label={`Editar ${nombre}`}>
        <Pencil size={16} aria-hidden="true" />Editar
      </Link>
      <button type="button" id={`estado-${recurso}-${registro.id}`} className={`admin-button admin-record-toggle${binario && !activo ? ' admin-record-activate' : ''}`}
        aria-label={`${cambio} ${nombre}`} onClick={() => establecerAccion('estado')}>
        <Power size={16} aria-hidden="true" />{binario ? cambio : 'Estado'}
      </button>
      <button type="button" className="admin-button admin-delete-outline" aria-label={`Eliminar ${nombre}`}
        disabled={Boolean(bloqueoEliminar)} title={bloqueoEliminar || undefined} onClick={() => establecerAccion('eliminar')}>
        <Trash2 size={16} aria-hidden="true" />Eliminar
      </button>
    </div>
    {accion && <DialogoOperacion
      titulo={eliminando ? `¿Eliminar ${nombre}?` : binario ? `¿${cambio} ${nombre}?` : `Estado de ${nombre}`}
      descripcion={eliminando ? descripcionesEliminar[recurso] : descripcionEstado}
      estados={!eliminando && !binario ? opcionesEstadoOperativo(recurso) : undefined}
      estadoInicial={binario ? activo ? '1' : '0' : estadoRegistro(recurso, registro)}
      textoConfirmar={eliminando ? 'Eliminar registro' : binario ? cambio : 'Confirmar estado'}
      tonoConfirmar={eliminando ? 'peligro' : binario && !activo ? 'positivo' : 'normal'}
      alCerrar={() => establecerAccion(null)}
      alConfirmar={async estado => {
        if (eliminando) await eliminarRegistro(recurso, registro.id);
        else await cambiarEstadoRegistro(recurso, registro.id, binario ? !activo : estado);
        if (!vigente.current) return;
        establecerAccion(null);
        alCompletar({ eliminado: eliminando, aviso: eliminando ? `Se eliminó «${nombre}».` : `Estado de «${nombre}» actualizado.` });
      }} />}
  </>;
}
