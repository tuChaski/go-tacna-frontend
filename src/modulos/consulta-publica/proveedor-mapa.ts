import type { StyleSpecification } from 'maplibre-gl';

export const CENTRO_TACNA: [number, number] = [-70.251, -18.0146];
export const ORIGEN_TESELAS = 'https://tile.openstreetmap.org';

/** Estilo local, sin sprites, fuentes remotas ni servicio de demostración.
 * Proveedor revisado: OSM Standard. Cambiarlo exige revisar también sus
 * condiciones, dominios permitidos y atribución (ver T058.md). */
export function estiloMapaPublico(): StyleSpecification {
  return {
    version: 8,
    sources: {
      calles: {
        type: 'raster', tiles: [`${ORIGEN_TESELAS}/{z}/{x}/{y}.png`],
        tileSize: 256, maxzoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      },
    },
    layers: [{ id: 'calles', type: 'raster', source: 'calles' }],
  };
}

/** Esta lista es cerrada: el proveedor no recibe cookies, Authorization ni
 * URLs de la API. Los recursos locales GeoJSON los genera el propio visor. */
export function solicitudMapa(url: string) {
  const destino = new URL(url);
  if (destino.origin !== ORIGEN_TESELAS || !/^\/\d+\/\d+\/\d+\.png$/.test(destino.pathname)
    || destino.search || destino.hash || destino.username || destino.password) throw new Error('Fuente de mapa no permitida.');
  // MapLibre tipa same-origin/include. Como solo admitimos este origen externo,
  // same-origin omite cookies del proveedor y no se añaden cabeceras privadas.
  return { url: destino.href, credentials: 'same-origin' as const };
}
