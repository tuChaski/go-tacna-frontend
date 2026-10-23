import { useEffect, useState } from 'react';
import api from '../../../services/api';
import type { CoordenadaRuta, DatosInicio, MicroInicio, RutaInicio } from './tipos-inicio';
import { microsRespaldo, rutasRespaldo } from './rutas-respaldo';

interface RutaApi {
  id: number;
  nombre_ruta: string;
  activo: boolean;
  trazado_ruta?: { type: string; coordinates: [number, number][] } | null;
  empresa?: { razon_social?: string } | null;
}

interface MicroApi {
  id: number;
  placa: string;
  ruta_id: number | null;
  estado: string;
}

interface RespuestaRutas {
  success: boolean;
  data?: RutaApi[];
}

interface RespuestaMicros {
  success: boolean;
  data?: MicroApi[];
}

const COLORES_RUTA = ['#38bdf8', '#60a5fa', '#93c5fd', '#7dd3fc'];

function convertirRuta(ruta: RutaApi, indice: number): RutaInicio | null {
  const coordenadas: CoordenadaRuta[] = [];

  for (const coordenada of ruta.trazado_ruta?.coordinates ?? []) {
    if (!Array.isArray(coordenada) || coordenada.length < 2) continue;
    const [longitud, latitud] = coordenada;
    if (typeof longitud !== 'number' || typeof latitud !== 'number') continue;
    if (!Number.isFinite(longitud) || !Number.isFinite(latitud)) continue;
    if (latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180) continue;
    coordenadas.push({ latitud, longitud });
  }

  if (coordenadas.length < 2) return null;

  return {
    id: ruta.id,
    nombre: ruta.nombre_ruta,
    empresa: ruta.empresa?.razon_social ?? 'Go Tacna',
    activa: ruta.activo,
    coordenadas,
    color: COLORES_RUTA[indice % COLORES_RUTA.length],
  };
}

/**
 * Consulta únicamente los endpoints públicos de rutas y micros activos.
 * Si la API no responde, la landing conserva una demostración funcional con
 * las rutas del seeder y lo indica en la interfaz.
 */
export function useDatosInicio(): DatosInicio {
  const [datos, establecerDatos] = useState<DatosInicio>({
    rutas: rutasRespaldo,
    micros: microsRespaldo,
    cargando: true,
    esRespaldo: true,
  });

  useEffect(() => {
    const controlador = new AbortController();

    async function cargar() {
      const [respuestaRutas, respuestaMicros] = await Promise.allSettled([
        api.get<RespuestaRutas>('/rutas', {
          params: { per_page: 10 },
          signal: controlador.signal,
        }),
        api.get<RespuestaMicros>('/micros/activos', {
          params: { per_page: 20 },
          signal: controlador.signal,
        }),
      ]);

      if (controlador.signal.aborted) return;

      const rutasDisponibles = respuestaRutas.status === 'fulfilled'
        && respuestaRutas.value.data.success
        && Array.isArray(respuestaRutas.value.data.data);
      const microsDisponibles = respuestaMicros.status === 'fulfilled'
        && respuestaMicros.value.data.success
        && Array.isArray(respuestaMicros.value.data.data);

      const rutasApi = rutasDisponibles && respuestaRutas.status === 'fulfilled'
        ? (respuestaRutas.value.data.data ?? [])
          .map(convertirRuta)
          .filter((ruta): ruta is RutaInicio => ruta !== null)
          .slice(0, 6)
        : [];

      const microsApi = microsDisponibles && respuestaMicros.status === 'fulfilled'
        ? (respuestaMicros.value.data.data ?? []).slice(0, 8).map(micro => ({
          id: micro.id,
          placa: micro.placa,
          rutaId: micro.ruta_id,
          estado: micro.estado,
          esDemo: false,
        }))
        : [];

      // El respaldo se usa solo cuando la API falla. Si responde con una
      // lista vacía, la interfaz muestra ese estado real en lugar de inventar
      // unidades o rutas de demostración.
      const usarRutasRespaldo = !rutasDisponibles;
      const usarMicrosRespaldo = !microsDisponibles;
      const micros: MicroInicio[] = usarMicrosRespaldo
        ? microsRespaldo.map(micro => ({ ...micro, esDemo: true }))
        : microsApi;

      establecerDatos({
        rutas: usarRutasRespaldo ? rutasRespaldo : rutasApi,
        micros,
        cargando: false,
        esRespaldo: usarRutasRespaldo || usarMicrosRespaldo,
      });
    }

    void cargar().catch(() => {
      if (!controlador.signal.aborted) {
        establecerDatos({
          rutas: rutasRespaldo,
          micros: microsRespaldo,
          cargando: false,
          esRespaldo: true,
        });
      }
    });

    return () => controlador.abort();
  }, []);

  return datos;
}
