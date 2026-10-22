/**
 * Datos temporales del login administrativo y reglas locales de presencia/correo.
 * No valida credenciales ni determina permisos: esas decisiones pertenecen a la API.
 */
export interface DatosAcceso {
  correo: string;
  contrasena: string;
}

export type ErroresAcceso = Partial<Record<keyof DatosAcceso, string>>;

export function validarAcceso(datos: DatosAcceso): ErroresAcceso {
  const errores: ErroresAcceso = {};
  if (!datos.correo.trim()) errores.correo = 'Ingresa tu correo electrónico.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())) {
    errores.correo = 'Ingresa un correo electrónico válido.';
  }
  // No se impone una longitud nueva a contraseñas existentes ni se modifica su valor.
  if (!datos.contrasena.trim()) errores.contrasena = 'Ingresa tu contraseña.';
  return errores;
}
