/** Lecturas públicas cancelables. Se inyecta el cliente para comprobar los
 * contratos y errores sin necesitar credenciales ni modificar datos reales. */
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { adaptarDetalle, adaptarMicro, adaptarPagina, adaptarRuta, identificador } from './contrato-publico.ts';

export function mensajeConsulta(error: unknown): string {
  if (!axios.isAxiosError(error)) return error instanceof Error ? error.message : 'No pudimos interpretar la información. Vuelve a intentar.';
  if (error.response?.status === 404) return 'Este registro ya no está disponible. Actualiza el listado.';
  if (error.response?.status === 429) return 'Hay muchas consultas en este momento. Espera un poco y vuelve a intentar.';
  if (error.response?.status === 401 || error.response?.status === 403) return 'La consulta pública no está disponible en este momento. Puedes volver a intentar sin iniciar sesión.';
  if (!error.response) return ['ECONNABORTED', 'ETIMEDOUT'].includes(error.code ?? '')
    ? 'La consulta está demorando demasiado. Vuelve a intentar.' : 'No pudimos conectar con el servicio. Revisa tu conexión y vuelve a intentar.';
  return 'El servicio no pudo responder. Vuelve a intentar en un momento.';
}

export function crearConsultaPublica(cliente: Pick<AxiosInstance, 'get'>) {
  async function leer(ruta: string, signal: AbortSignal, params?: Record<string, string | number>) {
    signal.throwIfAborted();
    const respuesta = await cliente.get<unknown>(ruta, { params, signal });
    // Algunos transportes pueden terminar incluso después de abortar. Esa
    // respuesta nunca debe volver a activar una selección que ya se abandonó.
    signal.throwIfAborted();
    return respuesta.data;
  }
  return {
    async rutas(busqueda: string, pagina: number, signal: AbortSignal) {
      identificador(pagina);
      const search = busqueda.trim();
      if (search.length > 180) throw new Error('Busca con un máximo de 180 caracteres.');
      return adaptarPagina(await leer('/rutas', signal, { search, page: pagina, per_page: 8 }), pagina, adaptarRuta);
    },
    async ruta(id: number, signal: AbortSignal) {
      identificador(id);
      return adaptarDetalle(await leer(`/rutas/${id}`, signal), id, adaptarRuta);
    },
    async micros(rutaId: number, pagina: number, signal: AbortSignal) {
      identificador(rutaId); identificador(pagina);
      return adaptarPagina(await leer('/micros/activos', signal, { ruta_id: rutaId, page: pagina, per_page: 6 }), pagina, valor => adaptarMicro(valor, rutaId));
    },
    async micro(id: number, rutaId: number, signal: AbortSignal) {
      identificador(id); identificador(rutaId);
      return adaptarDetalle(await leer(`/micros/${id}`, signal), id, valor => adaptarMicro(valor, rutaId));
    },
  };
}
