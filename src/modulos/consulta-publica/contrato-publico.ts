/** Lista permitida de datos para el visitante. Nunca conservamos los objetos de
 * usuario, conductor o historial de posiciones que también devuelve la API. */
import { leerTrazado } from './datos-mapa.ts';
import type { PosicionPublica } from './datos-mapa.ts';

export interface RutaPublica {
  id: number; nombre: string; empresa: string;
  coordenadas: { latitud: number; longitud: number }[];
  trazadoInvalido?: true;
}
export interface MicroPublico {
  id: number; placa: string; rutaId: number; capacidad: number | null;
  estado: 'disponible' | 'en_recorrido'; empresa: string;
  posicion: PosicionPublica | null;
}
export interface PaginaPublica<T> {
  registros: T[]; pagina: number; ultima: number; total: number;
}

export function objeto(valor: unknown): Record<string, unknown> {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) throw new Error('El servicio devolvió información incompleta. Vuelve a intentar.');
  return valor as Record<string, unknown>;
}
export function identificador(valor: unknown): number {
  if (typeof valor !== 'number' || !Number.isSafeInteger(valor) || valor < 1) throw new Error('El identificador recibido no es válido.');
  return valor;
}
function texto(valor: unknown): string {
  if (typeof valor !== 'string' || !valor.trim()) throw new Error('El servicio devolvió información incompleta. Vuelve a intentar.');
  return valor.trim();
}
function empresaPublica(valor: unknown): string {
  if (valor === undefined || valor === null) return 'Empresa de transporte';
  const empresa = objeto(valor);
  if (empresa.activo === false) throw new Error('Este servicio ya no está disponible para consulta pública.');
  return texto(empresa.razon_social);
}

export function adaptarRuta(valor: unknown): RutaPublica {
  const ruta = objeto(valor);
  if (ruta.activo !== true) throw new Error('Esta ruta ya no está disponible. Actualiza el listado.');
  // Un problema de geometría no impide consultar las unidades de la ruta.
  return { id: identificador(ruta.id), nombre: texto(ruta.nombre_ruta), empresa: empresaPublica(ruta.empresa), ...leerTrazado(ruta.trazado_ruta) };
}

export function adaptarMicro(valor: unknown, rutaId: number): MicroPublico {
  const micro = objeto(valor);
  if (micro.ruta_id !== rutaId) throw new Error('Este micro ya no pertenece a la ruta seleccionada. Actualiza sus unidades.');
  if (micro.estado !== 'disponible' && micro.estado !== 'en_recorrido') throw new Error('Este micro ya no está activo. Actualiza sus unidades.');
  if (micro.ruta != null) {
    const ruta = objeto(micro.ruta);
    if (ruta.activo === false || ruta.id !== rutaId) throw new Error('La ruta del micro ya no está disponible.');
  }
  const capacidad = micro.capacidad_pasajeros;
  return {
    id: identificador(micro.id), placa: texto(micro.placa), rutaId,
    capacidad: typeof capacidad === 'number' && Number.isSafeInteger(capacidad) && capacidad > 0 ? capacidad : null,
    estado: micro.estado, empresa: empresaPublica(micro.empresa),
    // Pendiente backend: no existe un DTO REST de posición pública autorizado.
    // No usar posiciones, ultima_posicion ni datos del conductor como atajo.
    // El visor admite el modelo mínimo para integrarlo cuando se acuerde.
    posicion: null,
  };
}

export function adaptarPagina<T>(valor: unknown, pagina: number, adaptar: (registro: unknown) => T): PaginaPublica<T> {
  const respuesta = objeto(valor);
  const meta = objeto(respuesta.meta);
  if (respuesta.success !== true || !Array.isArray(respuesta.data)) throw new Error('No se pudo validar el catálogo. Vuelve a intentar.');
  const actual = identificador(meta.current_page);
  const ultima = identificador(meta.last_page);
  if (actual !== pagina || actual > ultima || typeof meta.total !== 'number' || !Number.isSafeInteger(meta.total)
    || meta.total < respuesta.data.length || meta.total < 0) throw new Error('La paginación recibida no es válida. Actualiza el catálogo.');
  const registros = respuesta.data.map(adaptar);
  const ids = registros.map(registro => identificador(objeto(registro).id));
  if (new Set(ids).size !== ids.length) throw new Error('El catálogo contiene registros repetidos. Vuelve a intentar.');
  return { registros, pagina: actual, ultima, total: meta.total };
}

export function adaptarDetalle<T>(valor: unknown, id: number, adaptar: (registro: unknown) => T): T {
  const respuesta = objeto(valor);
  if (respuesta.success !== true || objeto(respuesta.data).id !== id) throw new Error('El servicio devolvió un detalle incompatible. Vuelve a intentar.');
  return adaptar(respuesta.data);
}
