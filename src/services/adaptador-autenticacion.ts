/**
 * Frontera entre las formas locales del frontend y AuthController de Laravel.
 * Centraliza los nombres y envoltorios del contrato publicado en backend/main
 * (be1c4eb) y documentación develop (e35b60f).
 * No interpreta JWT, crea permisos ni asigna empresa a un administrador.
 */
import type { AuthResponse, LoginCredentials, User } from '../types/auth';

export interface DatosRegistro {
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  contrasena: string;
}

/** Solo normaliza el correo; la contraseña siempre se envía con su valor original. */
export function prepararLogin(datos: LoginCredentials) {
  return { correo: datos.email.trim(), password: datos.contrasena };
}

/** Registro público de pasajeros; el payload no permite elegir un rol administrativo. */
export function prepararRegistro(datos: DatosRegistro) {
  return { dni: datos.dni.trim(), nombre: datos.nombre.trim(), apellido: datos.apellido.trim(),
    telefono: datos.telefono.trim(), correo: datos.email.trim(), password: datos.contrasena };
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

/** Solo acepta roles y empresas entregados por el Resource del servidor. */
function adaptarUsuario(valor: unknown): User {
  if (!esObjeto(valor) || typeof valor.id !== 'number' || !Number.isSafeInteger(valor.id) || valor.id <= 0
    || typeof valor.nombre !== 'string' || !valor.nombre.trim()
    || typeof valor.apellido !== 'string' || !valor.apellido.trim()
    || typeof valor.correo !== 'string' || !valor.correo.trim()
    || typeof valor.rol !== 'string' || !['admin_general', 'admin_empresa', 'conductor', 'pasajero'].includes(valor.rol)
    || valor.activo !== true) {
    throw new Error('El servidor devolvió un perfil de usuario no compatible o inactivo.');
  }
  // Se seleccionan únicamente campos necesarios. No se conserva el objeto crudo
  // del servidor, que podría incorporar otros atributos en una entrega posterior.
  const empresas: User['empresas'] = [];
  if (valor.rol === 'admin_empresa') {
    if (!Array.isArray(valor.administrador_empresa_perfiles)) throw new Error('Falta el alcance de empresas de la cuenta.');
    for (const perfil of valor.administrador_empresa_perfiles) {
      if (!esObjeto(perfil) || !esObjeto(perfil.empresa) || !Number.isSafeInteger(perfil.empresa_id)
        || Number(perfil.empresa_id) <= 0 || perfil.empresa.id !== perfil.empresa_id
        || typeof perfil.empresa.razon_social !== 'string' || !perfil.empresa.razon_social.trim()) throw new Error('El alcance de empresas no es compatible.');
      if (!empresas.some(empresa => empresa.id === perfil.empresa_id)) empresas.push({
        id: Number(perfil.empresa_id), razonSocial: perfil.empresa.razon_social });
    }
  }
  return { id: valor.id, nombre: valor.nombre, apellido: valor.apellido,
    email: valor.correo, rol: valor.rol as User['rol'], empresas };
}

/** Login y registro devuelven { success, data: { usuario, token, tipo } }. */
export function adaptarSesion(respuesta: unknown): AuthResponse {
  const datos = datosDeRespuesta(respuesta);
  if (typeof datos.token !== 'string' || !datos.token.trim() || datos.tipo !== 'bearer') {
    throw new Error('El servidor no devolvió un token de acceso compatible.');
  }
  return { user: adaptarUsuario(datos.usuario), token: datos.token };
}

/** GET /auth/me devuelve el usuario directamente en data, sin data.user. */
export function adaptarPerfil(respuesta: unknown): User {
  return adaptarUsuario(datosDeRespuesta(respuesta));
}
