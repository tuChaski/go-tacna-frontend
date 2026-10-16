/**
 * Escenario ficticio de T053 para revisar la asociación Micro 024 ↔ Carlos Pérez.
 * Centraliza las referencias compartidas para no mostrar un conductor libre aquí
 * y ocupado en otra pantalla. No hay escritura local, GPS ni consultas al servidor.
 */
import { conductorReferencia } from '../conductores/conductor-referencia';
import { companyPreviewPath, referenceRoute } from '../rutas/route-reference';
import type { ConductorSeleccionable, DatosMicro, RutaSeleccionable } from './formulario-micro';

export const rutaMicros = `${companyPreviewPath}/micros`;
export const empresaReferenciaId = 'andino-referencia';
export const microReferencia: Readonly<DatosMicro & { id: string; activo: boolean; enRecorrido: boolean }> = {
  id: 'micro-024-referencia', codigo: 'Micro 024', placa: 'DEM-024',
  rutaId: referenceRoute.id, conductorId: conductorReferencia.id,
  activo: true, enRecorrido: false,
};

export const rutasReferencia: readonly RutaSeleccionable[] = [
  { id: referenceRoute.id, nombre: referenceRoute.name, activa: referenceRoute.active, empresaId: empresaReferenciaId },
];
export const conductoresReferencia: readonly ConductorSeleccionable[] = [
  { id: conductorReferencia.id, nombre: conductorReferencia.nombreCompleto, activo: conductorReferencia.activo,
    empresaId: empresaReferenciaId, microId: microReferencia.id },
];
