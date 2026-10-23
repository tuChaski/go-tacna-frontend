/**
 * Modelo local del recorrido. El administrador trabaja con latitud/longitud;
 * GeoJSON usa el orden inverso [longitud, latitud]. Esta conversión explícita
 * evita enviar una geometría invertida al conectar Laravel/PostGIS.
 */
export interface PuntoRuta {
  latitud: number;
  longitud: number;
}

export interface TrazadoGeoJson {
  type: 'LineString';
  coordinates: [number, number][];
}

export function puntoValido(punto: PuntoRuta): boolean {
  return Number.isFinite(punto.latitud) && Number.isFinite(punto.longitud)
    && punto.latitud >= -90 && punto.latitud <= 90
    && punto.longitud >= -180 && punto.longitud <= 180;
}

/** Rechaza líneas vacías, puntos fuera de rango y segmentos sin desplazamiento. */
export function validarTrazado(puntos: readonly PuntoRuta[]): string | undefined {
  if (puntos.length < 2) return 'Define al menos dos puntos para el recorrido.';
  if (puntos.some(punto => !puntoValido(punto))) return 'Revisa las coordenadas: latitud entre −90 y 90, longitud entre −180 y 180.';
  if (puntos.some((punto, indice) => indice > 0 && punto.latitud === puntos[indice - 1].latitud
    && punto.longitud === puntos[indice - 1].longitud)) {
    return 'Dos puntos consecutivos coinciden. Corrige o elimina uno de ellos.';
  }
  return undefined;
}

/** Solo construye una geometría válida; no guarda ni añade una empresa supuesta. */
export function crearGeoJson(puntos: readonly PuntoRuta[]): TrazadoGeoJson {
  const error = validarTrazado(puntos);
  if (error) throw new Error(error);
  return { type: 'LineString', coordinates: puntos.map(punto => [punto.longitud, punto.latitud]) };
}
