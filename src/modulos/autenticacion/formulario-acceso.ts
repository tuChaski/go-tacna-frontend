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

/** Formatos de identidad usados en Tacna: DNI peruano y celular nacional. */
export const PATRON_DNI = /^\d{8}$/;
export const PATRON_TELEFONO = /^9\d{8}$/;
export const MENSAJE_DNI = 'El DNI debe tener exactamente 8 dígitos numéricos.';
export const MENSAJE_TELEFONO = 'El teléfono debe tener 9 dígitos y empezar con 9.';

/** Reglas de RegisterRequest más formato de DNI y teléfono; la confirmación se comprueba solo en UI. */
export function validarAlta(datos: DatosAlta): ErroresAlta {
  const errores: ErroresAlta = validarAcceso(datos);
  const limites = { nombre: 120, apellido: 120 } as const;
  for (const clave of Object.keys(limites) as (keyof typeof limites)[]) {
    if (!datos[clave].trim()) errores[clave] = 'Completa este campo.';
    else if (datos[clave].trim().length > limites[clave]) errores[clave] = `Usa como máximo ${limites[clave]} caracteres.`;
  }
  const formatos = { dni: [PATRON_DNI, MENSAJE_DNI], telefono: [PATRON_TELEFONO, MENSAJE_TELEFONO] } as const;
  for (const [clave, [patron, mensaje]] of Object.entries(formatos) as [keyof typeof formatos, readonly [RegExp, string]][]) {
    if (!datos[clave].trim()) errores[clave] = 'Completa este campo.';
    else if (!patron.test(datos[clave].trim())) errores[clave] = mensaje;
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
