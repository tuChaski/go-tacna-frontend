import type { RutaInicio } from '../datos/tipos-inicio';

export interface PuntoPlano {
  x: number;
  z: number;
}

export interface RutaPlana {
  id: number;
  nombre: string;
  empresa: string;
  color: string;
  puntos: PuntoPlano[];
}

export interface PuntoSvg {
  x: number;
  y: number;
}

const METROS_POR_GRADO_LATITUD = 110540;
const METROS_POR_GRADO_LONGITUD = 111320;

/**
 * Proyecta las coordenadas reales de una o varias rutas a un plano local.
 * Se usa una aproximación equirectangular: suficiente para una vista urbana
 * pequeña y mucho más simple que incorporar una librería de proyecciones.
 */
export function proyectarRutas(rutas: readonly RutaInicio[], tamano = 8): RutaPlana[] {
  const rutasValidas = rutas.filter(ruta => ruta.coordenadas.length >= 2);
  if (rutasValidas.length === 0) return [];

  let latitudMinima = Infinity;
  let latitudMaxima = -Infinity;
  let longitudMinima = Infinity;
  let longitudMaxima = -Infinity;

  for (const ruta of rutasValidas) {
    for (const coordenada of ruta.coordenadas) {
      latitudMinima = Math.min(latitudMinima, coordenada.latitud);
      latitudMaxima = Math.max(latitudMaxima, coordenada.latitud);
      longitudMinima = Math.min(longitudMinima, coordenada.longitud);
      longitudMaxima = Math.max(longitudMaxima, coordenada.longitud);
    }
  }

  const centroLatitud = (latitudMinima + latitudMaxima) / 2;
  const centroLongitud = (longitudMinima + longitudMaxima) / 2;
  const factorLongitud = Math.cos(centroLatitud * Math.PI / 180) * METROS_POR_GRADO_LONGITUD;

  let xMinimo = Infinity;
  let xMaximo = -Infinity;
  let zMinimo = Infinity;
  let zMaximo = -Infinity;

  const rutasEnMetros = rutasValidas.map(ruta => ({
    ruta,
    puntos: ruta.coordenadas.map(coordenada => {
      const x = (coordenada.longitud - centroLongitud) * factorLongitud;
      const z = -(coordenada.latitud - centroLatitud) * METROS_POR_GRADO_LATITUD;
      xMinimo = Math.min(xMinimo, x);
      xMaximo = Math.max(xMaximo, x);
      zMinimo = Math.min(zMinimo, z);
      zMaximo = Math.max(zMaximo, z);
      return { x, z };
    }),
  }));

  const centroX = (xMinimo + xMaximo) / 2;
  const centroZ = (zMinimo + zMaximo) / 2;
  const extension = Math.max(xMaximo - xMinimo, zMaximo - zMinimo, 1);
  const escala = tamano / extension;

  return rutasEnMetros.map(({ ruta, puntos }) => ({
    id: ruta.id,
    nombre: ruta.nombre,
    empresa: ruta.empresa,
    color: ruta.color,
    puntos: puntos.map(punto => ({
      x: (punto.x - centroX) * escala,
      z: (punto.z - centroZ) * escala,
    })),
  }));
}

/** Versión para miniaturas SVG; devuelve puntos dentro del viewBox indicado. */
export function proyectarRutaSvg(ruta: RutaInicio, ancho = 100, alto = 100, margen = 12): PuntoSvg[] {
  const [rutaPlana] = proyectarRutas([ruta], 8);
  if (!rutaPlana) return [];

  const anchoUtil = ancho - margen * 2;
  const altoUtil = alto - margen * 2;

  return rutaPlana.puntos.map(punto => ({
    x: margen + ((punto.x + 4) / 8) * anchoUtil,
    y: margen + ((punto.z + 4) / 8) * altoUtil,
  }));
}
