/** Mensajes controlados de acceso; nunca expone el error crudo, tokens ni credenciales. */
import axios from 'axios';
import type { ErroresAlta } from './formulario-acceso';

export function explicarErrorAcceso(error: unknown): { mensaje: string; campos: ErroresAlta } {
  if (!axios.isAxiosError(error)) return { mensaje: 'No se pudo interpretar la respuesta de acceso. Inténtalo otra vez.', campos: {} };
  const estado = error.response?.status;
  const mensajes: Record<number, string> = {
    401: 'El correo o la contraseña son incorrectos.',
    403: 'Tu cuenta no tiene acceso o está desactivada. Contacta a su administrador.',
    409: 'La operación no se puede completar con el estado actual de la cuenta.',
    422: 'Revisa los datos indicados e inténtalo otra vez.',
    429: 'Demasiados intentos. Espera un momento antes de volver a intentar.',
  };
  const campos: ErroresAlta = {};
  const errores = error.response?.data?.errors;
  const claves = { correo: 'correo', email: 'correo', password: 'contrasena', dni: 'dni', nombre: 'nombre', apellido: 'apellido', telefono: 'telefono' } as const;
  if (estado === 422 && errores && typeof errores === 'object') {
    for (const [remoto, local] of Object.entries(claves)) {
      if (errores[remoto]) campos[local] = remoto === 'correo' || remoto === 'email'
        ? 'Revisa el correo: puede ser inválido o estar registrado.'
        : remoto === 'dni' ? 'Revisa el documento: puede estar registrado o no ser válido.' : 'Revisa este campo según los requisitos indicados.';
    }
  }
  return { mensaje: estado ? mensajes[estado] ?? 'El servidor no pudo completar la operación. Inténtalo más tarde.'
    : 'No se pudo conectar con el servidor. Revisa la conexión e inténtalo otra vez.', campos };
}
