import type { MicroInicio, RutaInicio } from './tipos-inicio';

/**
 * Respaldo local con los mismos datos de demostración del seeder. Se usa solo
 * si la API pública no responde o devuelve rutas sin trazado válido.
 */
export const rutasRespaldo: RutaInicio[] = [
  {
    id: 1,
    nombre: 'Ruta Centro - Mercado',
    empresa: 'Transportes Tacna S.A.C.',
    activa: true,
    color: '#38bdf8',
    coordenadas: [
      { longitud: -70.2465, latitud: -18.014 },
      { longitud: -70.241, latitud: -18.0195 },
      { longitud: -70.2355, latitud: -18.025 },
      { longitud: -70.23, latitud: -18.0305 },
    ],
  },
  {
    id: 2,
    nombre: 'Ruta Terminal - Ciudad Nueva',
    empresa: 'Rutas del Sur E.I.R.L.',
    activa: true,
    color: '#60a5fa',
    coordenadas: [
      { longitud: -70.252, latitud: -18.01 },
      { longitud: -70.247, latitud: -18.015 },
      { longitud: -70.242, latitud: -18.02 },
    ],
  },
];

export const microsRespaldo: MicroInicio[] = [
  { id: 1, placa: 'V1A-101', rutaId: 1, estado: 'disponible', esDemo: true },
  { id: 2, placa: 'V2B-202', rutaId: 2, estado: 'disponible', esDemo: true },
];
