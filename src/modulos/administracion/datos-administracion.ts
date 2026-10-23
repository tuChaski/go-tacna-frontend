/** Contratos de lectura usados por el panel. Se seleccionan solo datos públicos;
 * contraseñas y tokens pertenecen al envío o a la sesión, nunca a los registros.
 */
import type { TrazadoGeoJson } from './rutas/trazado-ruta';

export type Recurso = 'empresas' | 'rutas' | 'conductores' | 'micros';
export interface CuentaAdministrativa {
  id: number; dni: string; nombre: string; apellido: string; correo: string;
  telefono: string; activo: boolean; rol: string;
}
export interface RegistroAdministrativo {
  id: number;
  empresa_id?: number;
  razon_social?: string; ruc?: string; telefono?: string; direccion?: string; activo?: boolean;
  nombre_ruta?: string; trazado_ruta?: TrazadoGeoJson | null;
  licencia_conducir?: string; estado_operativo?: string; usuario_id?: number; usuario?: CuentaAdministrativa;
  micro_actual?: { id: number; placa: string } | null;
  placa?: string; capacidad_pasajeros?: number; estado?: string;
  ruta_id?: number | null; conductor_actual_id?: number | null;
  ruta?: { id: number; nombre_ruta: string }; conductor_actual?: { usuario?: CuentaAdministrativa };
  administradores?: { id: number; usuario_id: number; usuario?: CuentaAdministrativa }[];
}
export interface PaginaRegistros {
  data: RegistroAdministrativo[];
  meta: { current_page: number; last_page: number; total: number };
}

export const nombresRecursos: Record<Recurso, string> = {
  empresas: 'Empresas', rutas: 'Rutas', conductores: 'Conductores', micros: 'Micros',
};
export function tituloRegistro(recurso: Recurso, registro: RegistroAdministrativo): string {
  if (recurso === 'empresas') return registro.razon_social ?? 'Empresa';
  if (recurso === 'rutas') return registro.nombre_ruta ?? 'Ruta';
  if (recurso === 'micros') return registro.placa ?? 'Micro';
  return `${registro.usuario?.nombre ?? ''} ${registro.usuario?.apellido ?? ''}`.trim() || 'Conductor';
}
export function estadoRegistro(recurso: Recurso, registro: RegistroAdministrativo): string {
  if (recurso === 'conductores') return registro.estado_operativo ?? 'sin_conexion';
  if (recurso === 'micros') return registro.estado ?? 'inactivo';
  return registro.activo ? 'Activo' : 'Inactivo';
}
