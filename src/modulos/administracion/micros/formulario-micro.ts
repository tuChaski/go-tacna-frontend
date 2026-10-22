/**
 * Modelo local y validaciones de la pantalla de Micros.
 * Los identificadores son referencias de interfaz, no nombres de columnas ni payloads REST.
 * Estas comprobaciones orientan al administrador; la API debe repetirlas de forma atómica
 * porque otro administrador podría cambiar una asignación mientras el formulario está abierto.
 */
export interface DatosMicro {
  codigo: string;
  placa: string;
  rutaId: string;
  conductorId: string;
}

export interface RutaSeleccionable {
  id: string;
  nombre: string;
  empresaId: string;
  activa: boolean;
}

export interface ConductorSeleccionable {
  id: string;
  nombre: string;
  empresaId: string;
  activo: boolean;
  microId: string | null;
}

export interface ContextoValidacionMicro {
  empresaId: string;
  rutas: readonly RutaSeleccionable[];
  conductores: readonly ConductorSeleccionable[];
  microActual?: DatosMicro & { id: string; enRecorrido: boolean };
}

export type ErroresMicro = Partial<Record<keyof DatosMicro, string>>;

/** Permite conservar al conductor actual, pero impide tomar uno asignado a otro micro. */
export function conductorDisponible(conductor: ConductorSeleccionable, empresaId: string, microId?: string) {
  return conductor.activo && conductor.empresaId === empresaId
    && (conductor.microId === null || conductor.microId === microId);
}

/**
 * Valida presencia, ruta activa y asignación uno a uno usando el catálogo recibido.
 * El conductor vacío significa «sin asignar» y es válido. Código/placa no se fuerzan
 * a un formato ni se comprueba unicidad global hasta que el contrato lo especifique.
 */
export function validarMicro(datos: DatosMicro, contexto: ContextoValidacionMicro): ErroresMicro {
  const errores: ErroresMicro = {};
  if (!datos.codigo.trim()) errores.codigo = 'Ingresa el código del micro.';
  if (!datos.placa.trim()) errores.placa = 'Ingresa la placa.';
  const ruta = contexto.rutas.find(item => item.id === datos.rutaId);
  if (!ruta || !ruta.activa || ruta.empresaId !== contexto.empresaId) {
    errores.rutaId = 'Selecciona una ruta activa de esta empresa.';
  }
  if (datos.conductorId) {
    const conductor = contexto.conductores.find(item => item.id === datos.conductorId);
    if (!conductor || !conductorDisponible(conductor, contexto.empresaId, contexto.microActual?.id)) {
      errores.conductorId = 'Selecciona un conductor disponible de esta empresa.';
    }
  }

  // La restricción se repite al enviar: deshabilitar controles por sí solo no basta.
  if (contexto.microActual?.enRecorrido) {
    if (datos.rutaId !== contexto.microActual.rutaId) errores.rutaId = 'Finaliza el recorrido antes de cambiar la ruta.';
    if (datos.conductorId !== contexto.microActual.conductorId) errores.conductorId = 'Finaliza el recorrido antes de cambiar el conductor.';
  }
  return errores;
}
