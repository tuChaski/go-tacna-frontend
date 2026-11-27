/** Mensajes compartidos; las respuestas crudas no se muestran en la interfaz. */
import axios from 'axios';
import { ErrorSesion } from './sesion-http.ts';

export function mensajeErrorHttp(error: unknown): string {
  if (error instanceof ErrorSesion) return error.message;
  if (!axios.isAxiosError(error)) return 'No se pudo interpretar la respuesta del servicio.';
  if (!error.response) return ['ECONNABORTED', 'ETIMEDOUT'].includes(error.code ?? '')
    ? 'El servidor está demorando demasiado. Revisa el resultado antes de repetir un guardado.'
    : 'No se pudo confirmar la operación. Revisa la conexión y el resultado antes de repetir un guardado.';
  const mensajes: Record<number, string> = {
    401: 'Tu sesión terminó. Inicia sesión nuevamente.',
    403: 'Tu cuenta no tiene permiso para esta operación o empresa.',
    404: 'El registro ya no existe o no está disponible.',
    409: 'No se puede completar por registros relacionados o una asignación ocupada. Revisa sus dependencias.',
    422: 'Revisa los campos indicados. Puede haber datos inválidos, duplicados o asignaciones no permitidas.',
    429: 'Demasiadas solicitudes. Espera un momento y vuelve a intentar.',
  };
  return mensajes[error.response.status] ?? 'El servidor no pudo completar la operación. Revisa el resultado antes de repetir un guardado.';
}
