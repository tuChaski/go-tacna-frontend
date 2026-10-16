/**
 * Frontera entre las formas locales del frontend y AuthController de Laravel.
 * Centraliza los nombres y envoltorios del contrato publicado en backend/main
 * (6cbe163). Si ese contrato cambia, se revisa aquí antes de cambiar formularios.
 * No interpreta JWT, crea permisos ni asigna empresa a un administrador.
 */
import type { AuthResponse, LoginCredentials, User } from '../types/auth';

export interface DatosRegistro {
  nombre: string;
  email: string;
  contrasena: string;
}

/** Solo normaliza el correo; la contraseña siempre se envía con su valor original. */
export function prepararLogin(datos: LoginCredentials) {
  return { email: datos.email.trim(), password: datos.contrasena };
}

/** Registro público de pasajeros; el payload no permite elegir un rol administrativo. */
export function prepararRegistro(datos: DatosRegistro) {
  return { name: datos.nombre.trim(), email: datos.email.trim(), password: datos.contrasena };
}

// Las respuestas de red son desconocidas hasta comprobarlas: TypeScript por sí
// solo no garantiza que el servidor haya entregado la estructura acordada.
function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function datosDeRespuesta(respuesta: unknown): Record<string, unknown> {
  if (!esObjeto(respuesta) || respuesta.success !== true || !esObjeto(respuesta.data)) {
    throw new Error('El servidor devolvió una respuesta de autenticación no compatible.');
  }
  return respuesta.data;
}

/** Traduce name/role sin inventar subtipos del rol admin ni datos de empresa. */
function adaptarUsuario(valor: unknown): User {
  if (!esObjeto(valor) || typeof valor.id !== 'number' || !Number.isSafeInteger(valor.id) || valor.id <= 0
    || typeof valor.name !== 'string' || !valor.name.trim()
    || typeof valor.email !== 'string' || !valor.email.trim()
    || (valor.role !== 'admin' && valor.role !== 'conductor' && valor.role !== 'pasajero')
    || valor.activo !== true) {
    throw new Error('El servidor devolvió un perfil de usuario no compatible o inactivo.');
  }
  // Se seleccionan únicamente campos necesarios. No se conserva el objeto crudo
  // del servidor, que podría incorporar otros atributos en una entrega posterior.
  return { id: valor.id, nombre: valor.name, email: valor.email, rol: valor.role };
}

/** Login y registro devuelven { success, data: { user, token, type } }. */
export function adaptarSesion(respuesta: unknown): AuthResponse {
  const datos = datosDeRespuesta(respuesta);
  if (typeof datos.token !== 'string' || !datos.token.trim() || datos.type !== 'bearer') {
    throw new Error('El servidor no devolvió un token de acceso compatible.');
  }
  return { user: adaptarUsuario(datos.user), token: datos.token };
}

/** GET /auth/me devuelve el usuario directamente en data, sin data.user. */
export function adaptarPerfil(respuesta: unknown): User {
  return adaptarUsuario(datosDeRespuesta(respuesta));
}
