/** Datos geográficos mínimos. No se deducen posiciones del historial GPS. */
export interface PosicionPublica { longitud: number; latitud: number; fecha: string }
export interface CoordenadaPublica { longitud: number; latitud: number }

export function coordenadaValida(longitud: unknown, latitud: unknown): boolean {
  return typeof longitud === 'number' && typeof latitud === 'number'
    && Number.isFinite(longitud) && Number.isFinite(latitud)
    && Math.abs(longitud) <= 180 && Math.abs(latitud) <= 90;
}

export function leerTrazado(valor: unknown): { coordenadas: CoordenadaPublica[]; trazadoInvalido?: true } {
  if (valor == null) return { coordenadas: [] };
  const invalido = { coordenadas: [], trazadoInvalido: true as const };
  if (typeof valor !== 'object' || Array.isArray(valor)) return invalido;
  const trazado = valor as Record<string, unknown>;
  // No se repara un recorrido parcial: unir puntos válidos alrededor de un
  // punto corrupto dibujaría un trayecto que el servidor nunca publicó.
  if (trazado.type !== 'LineString' || !Array.isArray(trazado.coordinates)
    || trazado.coordinates.length < 2 || trazado.coordinates.length > 20000) return invalido;
  const coordenadas: CoordenadaPublica[] = [];
  for (const punto of trazado.coordinates) {
    if (!Array.isArray(punto) || punto.length !== 2 || !coordenadaValida(punto[0], punto[1])) return invalido;
    coordenadas.push({ longitud: punto[0], latitud: punto[1] });
  }
  if (coordenadas.every(p => p.longitud === coordenadas[0].longitud && p.latitud === coordenadas[0].latitud)) return invalido;
  return { coordenadas };
}

/** Validador para el DTO mínimo del visor. Solo debe recibir posiciones cuya
 * publicación ya haya autorizado el contrato backend; no acredita permisos. */
export function validarPosicionPublica(valor: unknown): PosicionPublica | null {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return null;
  const { longitud, latitud, fecha } = valor as Record<string, unknown>;
  if (!coordenadaValida(longitud, latitud) || typeof fecha !== 'string'
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(fecha)
    || !Number.isFinite(Date.parse(fecha))) return null;
  const [anio, mes, dia] = fecha.slice(0, 10).split('-').map(Number);
  if (mes < 1 || mes > 12 || dia < 1 || dia > new Date(Date.UTC(anio, mes, 0)).getUTCDate()) return null;
  return { longitud: longitud as number, latitud: latitud as number, fecha: new Date(fecha).toISOString() };
}

export function limitesRecorrido(coordenadas: CoordenadaPublica[]): [[number, number], [number, number]] | null {
  if (coordenadas.length < 2 || coordenadas.some(p => !coordenadaValida(p.longitud, p.latitud))) return null;
  let oeste = Infinity, este = -Infinity, sur = Infinity, norte = -Infinity;
  for (const p of coordenadas) {
    oeste = Math.min(oeste, p.longitud); este = Math.max(este, p.longitud);
    sur = Math.min(sur, p.latitud); norte = Math.max(norte, p.latitud);
  }
  return [[oeste, sur], [este, norte]];
}

export function textoFechaPosicion(posicion: PosicionPublica): string {
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' }).format(new Date(posicion.fecha));
}
