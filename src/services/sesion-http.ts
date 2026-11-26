/** Renovación preventiva: el backend actual rechaza refresh con JWT vencido.
 * La lectura de exp solo programa la renovación; nunca concede permisos.
 */
import axios, { CanceledError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

interface ConfigSesion extends InternalAxiosRequestConfig {
  sesionGoTacna?: { version: number; token: string; reintentada: boolean };
}
interface OpcionesSesion {
  leerToken: () => string | null;
  escribirToken: (token: string | null) => void;
  avisarToken: () => void;
  avisarSalida: (motivo?: string) => void;
  renovar: (token: string, signal: AbortSignal) => Promise<string>;
  coordinar?: (trabajo: () => Promise<string>) => Promise<string>;
  ahora?: () => number;
}

export class ErrorSesion extends Error {}

function tiemposToken(token: string): { vence: number; margen: number } | null {
  try {
    const partes = token.split('.');
    if (partes.length !== 3) return null;
    const datos: unknown = JSON.parse(atob(partes[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!datos || typeof datos !== 'object' || !('exp' in datos)
      || typeof datos.exp !== 'number' || !Number.isFinite(datos.exp)) return null;
    const emitido = 'iat' in datos && typeof datos.iat === 'number' ? datos.iat : null;
    const duracion = emitido === null ? null : (datos.exp - emitido) * 1000;
    // Con TTL cortos no se renueva constantemente desde el mismo inicio.
    const margen = duracion !== null && duracion > 0 ? Math.min(60_000, duracion / 5) : 60_000;
    return { vence: datos.exp * 1000, margen };
  } catch { return null; }
}

export function demoraRenovacion(token: string, ahora = Date.now()): number | null {
  const tiempos = tiemposToken(token);
  return tiempos ? Math.max(0, tiempos.vence - tiempos.margen - ahora) : null;
}

export function instalarSesionHttp(cliente: AxiosInstance, opciones: OpcionesSesion) {
  const ahora = opciones.ahora ?? Date.now;
  let version = 0;
  let pendiente: Promise<string> | null = null;
  let controlador: AbortController | null = null;

  function cambiarVersion() {
    version += 1;
    controlador?.abort();
    controlador = null;
    pendiente = null;
  }
  function cerrarLocalmente(motivo?: string): string | null {
    const token = opciones.leerToken();
    cambiarVersion();
    opciones.escribirToken(null);
    opciones.avisarSalida(motivo);
    return token;
  }
  function guardarSesion(token: string) {
    cambiarVersion();
    opciones.escribirToken(token);
    opciones.avisarToken();
  }
  function comprobar(versionEsperada: number, token: string) {
    if (version !== versionEsperada || opciones.leerToken() !== token) {
      throw new CanceledError('La sesión cambió durante la solicitud.');
    }
  }
  async function renovarSiCorresponde(): Promise<string | null> {
    const token = opciones.leerToken();
    if (!token) return null;
    if (pendiente) return pendiente;
    const tiempos = tiemposToken(token);
    if (!tiempos || ahora() < tiempos.vence - tiempos.margen) return token;
    if (ahora() >= tiempos.vence) {
      cerrarLocalmente('Tu sesión venció. Inicia sesión nuevamente.');
      throw new ErrorSesion('Tu sesión venció. Inicia sesión nuevamente.');
    }
    const versionEsperada = version;
    const aborto = new AbortController();
    controlador = aborto;
    const trabajo = async () => {
      if (version !== versionEsperada || aborto.signal.aborted) throw new CanceledError();
      // Otra pestaña puede haber renovado mientras se esperaba el bloqueo.
      const actual = opciones.leerToken();
      if (!actual) throw new CanceledError();
      if (actual !== token) return actual;
      let nuevo: string;
      try {
        nuevo = await opciones.renovar(token, aborto.signal);
        comprobar(versionEsperada, token);
        const nuevosTiempos = tiemposToken(nuevo);
        if (nuevo === token || !nuevosTiempos || nuevosTiempos.vence <= ahora()) {
          throw new ErrorSesion('No se pudo validar la renovación. Inicia sesión nuevamente.');
        }
      } catch (error) {
        comprobar(versionEsperada, token);
        const estado = axios.isAxiosError(error) ? error.response?.status : undefined;
        if (estado === 401 || estado === 403 || error instanceof ErrorSesion) {
          cerrarLocalmente('Tu sesión terminó. Inicia sesión nuevamente.');
        }
        throw error;
      }
      opciones.escribirToken(nuevo);
      opciones.avisarToken();
      return nuevo;
    };
    const promesa = Promise.resolve().then(() => opciones.coordinar ? opciones.coordinar(trabajo) : trabajo());
    pendiente = promesa;
    try { return await promesa; }
    finally {
      if (pendiente === promesa) { pendiente = null; controlador = null; }
    }
  }

  const solicitud = cliente.interceptors.request.use(async (config: ConfigSesion) => {
    const acceso = /\/auth\/(login|register|refresh|logout)\/?(?:\?|$)/.test(config.url ?? '');
    if (acceso) return config;
    if (config.signal?.aborted) throw new CanceledError();
    const versionEsperada = version;
    const token = await renovarSiCorresponde();
    if (config.signal?.aborted || versionEsperada !== version) throw new CanceledError();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
      config.sesionGoTacna = { version, token, reintentada: config.sesionGoTacna?.reintentada ?? false };
    } else config.headers.delete('Authorization');
    return config;
  });
  const respuesta = cliente.interceptors.response.use(
    response => {
      const sesion = (response.config as ConfigSesion).sesionGoTacna;
      if (sesion && sesion.version !== version) throw new CanceledError();
      return response;
    },
    async (error: unknown) => {
      if (!axios.isAxiosError(error)) throw error;
      const config = error.config as ConfigSesion | undefined;
      const sesion = config?.sesionGoTacna;
      if (!config || !sesion) throw error;
      if (sesion.version !== version) throw new CanceledError();
      if (error.response?.status !== 401) throw error;
      const actual = opciones.leerToken();
      if (actual && actual !== sesion.token) {
        // Solo lecturas: una escritura nunca se repite automáticamente.
        if (!sesion.reintentada && ['get', 'head', 'options'].includes(config.method ?? 'get')) {
          config.sesionGoTacna = { ...sesion, reintentada: true };
          return cliente.request(config);
        }
      } else if (actual === sesion.token) cerrarLocalmente('Tu sesión terminó. Inicia sesión nuevamente.');
      throw error;
    },
  );
  return {
    renovarSiCorresponde,
    guardarSesion,
    cerrarLocalmente,
    sincronizar: cambiarVersion,
    leerToken: opciones.leerToken,
    desmontar() { cambiarVersion(); cliente.interceptors.request.eject(solicitud); cliente.interceptors.response.eject(respuesta); },
  };
}
