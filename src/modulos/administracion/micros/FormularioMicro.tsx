/**
 * Registro/edición de Micros. Mantiene una copia temporal de los campos y permite
 * revisar las asociaciones sin alterar el ejemplo. Cancelar descarta esa copia.
 * El servicio REST se conectará después de acordar contrato, errores y permisos.
 */
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { PageHeading } from '../componentes/PageHeading';
import { PendingNotice } from '../componentes/PendingNotice';
import { ContextoMicro } from './ContextoMicro';
import { conductorDisponible, validarMicro } from './formulario-micro';
import type { DatosMicro, ErroresMicro } from './formulario-micro';
import { conductoresReferencia, empresaReferenciaId, microReferencia, rutaMicros, rutasReferencia } from './micro-referencia';

export function FormularioMicro({ editando = false }: { editando?: boolean }) {
  const [datos, establecerDatos] = useState<DatosMicro>(() => ({
    codigo: editando ? microReferencia.codigo : '', placa: editando ? microReferencia.placa : '',
    rutaId: editando ? microReferencia.rutaId : '', conductorId: editando ? microReferencia.conductorId : '',
  }));
  const [errores, establecerErrores] = useState<ErroresMicro>({});
  const [pendiente, establecerPendiente] = useState(false);
  const formulario = useRef<HTMLFormElement>(null);
  const actual = editando ? microReferencia : undefined;
  const contexto = { empresaId: empresaReferenciaId, rutas: rutasReferencia, conductores: conductoresReferencia, microActual: actual };
  const bloquearAsignacion = Boolean(actual?.enRecorrido);
  const disponibles = conductoresReferencia.filter(item => conductorDisponible(item, empresaReferenciaId, actual?.id));

  /** Revalida un campo ya marcado al corregirlo y retira el aviso del envío anterior. */
  function cambiar(clave: keyof DatosMicro, valor: string) {
    const siguientes = { ...datos, [clave]: valor };
    establecerDatos(siguientes);
    establecerPendiente(false);
    if (errores[clave]) establecerErrores(anteriores => ({ ...anteriores, [clave]: validarMicro(siguientes, contexto)[clave] }));
  }

  // Informa al salir del campo sin adelantar errores de controles aún no visitados.
  function revisar(clave: keyof DatosMicro) {
    establecerErrores(anteriores => ({ ...anteriores, [clave]: validarMicro(datos, contexto)[clave] }));
  }

  /** Valida todo antes de enviar; dirige el teclado al primer error en orden visual. */
  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const siguientes = validarMicro(datos, contexto);
    establecerErrores(siguientes);
    establecerPendiente(false);
    const orden: (keyof DatosMicro)[] = ['codigo', 'placa', 'rutaId', 'conductorId'];
    const primerError = orden.find(clave => siguientes[clave]);
    if (primerError) {
      formulario.current?.querySelector<HTMLElement>(`#micro-${primerError}`)?.focus();
      return;
    }
    // No construir un payload supuesto ni anunciar éxito: aquí irá la llamada real.
    establecerPendiente(true);
  }

  return (
    <>
      <Link className="admin-back-link" to={rutaMicros}><ArrowLeft size={18} aria-hidden="true" />Volver a micros</Link>
      <PageHeading title={editando ? 'Editar micro' : 'Registrar micro'} description="Identifica la unidad y selecciona su ruta y conductor." />
      <div className="admin-columns">
        <form className="admin-card admin-form" ref={formulario} onSubmit={guardar} noValidate>
          <h2>Datos del micro</h2>
          <p className="admin-small admin-muted">Código, placa y ruta son obligatorios. El conductor es opcional.</p>

          {/* Identificación de la unidad: el formato oficial y la unicidad se validarán con la API. */}
          {(['codigo', 'placa'] as const).map(clave => (
            <div className="admin-field" key={clave}>
              <label htmlFor={`micro-${clave}`}>{clave === 'codigo' ? 'Código del micro' : 'Placa'}</label>
              <input id={`micro-${clave}`} name={clave} required autoComplete="off" value={datos[clave]}
                placeholder={clave === 'codigo' ? 'Ej. Micro 024' : 'Ej. DEM-024'}
                aria-invalid={Boolean(errores[clave])} aria-describedby={`micro-${clave}-ayuda`}
                onBlur={() => revisar(clave)} onChange={evento => cambiar(clave, evento.target.value)} />
              <p id={`micro-${clave}-ayuda`} className={errores[clave] ? 'admin-field-error' : 'admin-field-help'}>
                {errores[clave] || (clave === 'codigo' ? 'Identificador interno de la unidad.' : 'Placa con la que se identifica el micro.')}
              </p>
            </div>
          ))}

          {/* Solo se ofrecen rutas activas de la empresa. El servidor debe comprobarlo nuevamente. */}
          <div className="admin-field">
            <label htmlFor="micro-rutaId">Ruta asignada</label>
            <select id="micro-rutaId" required disabled={bloquearAsignacion} value={datos.rutaId}
              aria-invalid={Boolean(errores.rutaId)} aria-describedby="micro-rutaId-ayuda"
              onBlur={() => revisar('rutaId')} onChange={evento => cambiar('rutaId', evento.target.value)}>
              <option value="">Selecciona una ruta</option>
              {rutasReferencia.filter(ruta => ruta.activa && ruta.empresaId === empresaReferenciaId).map(ruta => (
                <option key={ruta.id} value={ruta.id}>{ruta.nombre}</option>
              ))}
            </select>
            <p id="micro-rutaId-ayuda" className={errores.rutaId ? 'admin-field-error' : 'admin-field-help'}>
              {errores.rutaId || 'Selecciona una ruta activa de Andino Demo.'}
            </p>
          </div>

          {/* Un conductor ocupado se muestra deshabilitado para explicar por qué no es elegible.
              Al editar, el conductor de esta misma unidad sigue disponible para conservarlo. */}
          <div className="admin-field">
            <label htmlFor="micro-conductorId">Conductor asignado</label>
            <select id="micro-conductorId" disabled={bloquearAsignacion} value={datos.conductorId}
              aria-invalid={Boolean(errores.conductorId)} aria-describedby="micro-conductorId-ayuda"
              onChange={evento => cambiar('conductorId', evento.target.value)} onBlur={() => revisar('conductorId')}>
              <option value="">Sin conductor asignado</option>
              {conductoresReferencia.filter(item => item.empresaId === empresaReferenciaId && item.activo).map(item => (
                <option key={item.id} value={item.id} disabled={!conductorDisponible(item, empresaReferenciaId, actual?.id)}>
                  {item.nombre}{conductorDisponible(item, empresaReferenciaId, actual?.id) ? '' : ' · Asignado a otro micro'}
                </option>
              ))}
            </select>
            <p id="micro-conductorId-ayuda" className={errores.conductorId ? 'admin-field-error' : 'admin-field-help'}>
              {errores.conductorId || (disponibles.length ? 'Opcional. Solo conductores disponibles de esta empresa.' : 'No hay conductores disponibles en este ejemplo. Puedes registrar el micro sin conductor.')}
            </p>
          </div>
          {bloquearAsignacion && <p className="admin-pending">Finaliza el recorrido antes de cambiar la ruta o el conductor.</p>}
          <div className="admin-form-actions">
            <Link className="admin-button admin-outline" to={rutaMicros}>Cancelar</Link>
            <button type="submit" className="admin-button"><Save size={18} aria-hidden="true" />Guardar micro</button>
          </div>
          {pendiente && <p className="admin-pending" role="status">Los campos están completos. El guardado requiere conectar la API; no se guardaron datos ni se cambiaron asignaciones.</p>}
        </form>
        <ContextoMicro datos={datos} />
      </div>
      <PendingNotice />
    </>
  );
}
