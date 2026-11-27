/**
 * Datos temporales del login administrativo y reglas locales de presencia/correo.
 * No valida credenciales ni determina permisos: esas decisiones pertenecen a la API.
 */
export interface DatosAcceso {
  correo: string;
  contrasena: string;
}

export type ErroresAcceso = Partial<Record<keyof DatosAcceso, string>>;

export interface DatosAlta extends DatosAcceso {
  dni: string; nombre: string; apellido: string; telefono: string; confirmacion: string;
}
export type ErroresAlta = Partial<Record<keyof DatosAlta, string>>;

/** Reglas publicadas por RegisterRequest; la confirmación se comprueba solo en UI. */
export function validarAlta(datos: DatosAlta): ErroresAlta {
  const errores: ErroresAlta = validarAcceso(datos);
  const limites = { dni: 20, nombre: 120, apellido: 120, telefono: 30 } as const;
  for (const clave of Object.keys(limites) as (keyof typeof limites)[]) {
    if (!datos[clave].trim()) errores[clave] = 'Completa este campo.';
    else if (datos[clave].trim().length > limites[clave]) errores[clave] = `Usa como máximo ${limites[clave]} caracteres.`;
  }
  if (datos.correo.trim().length > 150) errores.correo = 'Usa como máximo 150 caracteres.';
  if (datos.contrasena.length < 8) errores.contrasena = 'La contraseña debe tener al menos 8 caracteres.';
  if (!datos.confirmacion || datos.confirmacion !== datos.contrasena) errores.confirmacion = 'Las contraseñas deben coincidir.';
  return errores;
}

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
