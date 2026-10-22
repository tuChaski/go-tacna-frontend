/** Campos de la interfaz de Conductores; no define el payload del backend. */
export interface DatosFormularioConductor {
  nombreCompleto: string;
  documento: string;
  correo: string;
  contrasena: string;
}

export type ErroresConductor = Partial<Record<keyof DatosFormularioConductor, string>>;

/** Definición compartida por el formulario y el detalle, sin exponer contraseñas. */
export const camposDatosConductor = [
  { clave: 'nombreCompleto', etiqueta: 'Nombre completo', ejemplo: 'Nombres y apellidos', ayuda: 'Nombre con el que identificarás al conductor.', tipo: 'text' },
  { clave: 'documento', etiqueta: 'Documento', ejemplo: 'Documento de identidad', ayuda: 'Identificador del conductor.', tipo: 'text' },
  { clave: 'correo', etiqueta: 'Correo de acceso', ejemplo: 'conductor@ejemplo.pe', ayuda: 'La empresa entrega este acceso al conductor.', tipo: 'email' },
] as const;

/** Valida solo presencia y correo básico; documento, unicidad y contraseña dependen del contrato. */
export function validarConductor(datos: DatosFormularioConductor, creando: boolean): ErroresConductor {
  const errores: ErroresConductor = {};

  for (const campo of camposDatosConductor) {
    if (!datos[campo.clave].trim()) errores[campo.clave] = `Completa el campo «${campo.etiqueta}».`;
  }
  if (datos.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())) {
    errores.correo = 'Ingresa un correo electrónico válido.';
  }
  if (creando && !datos.contrasena.trim()) {
    errores.contrasena = 'Ingresa una contraseña inicial.';
  } else if (datos.contrasena.length > 0 && !datos.contrasena.trim()) {
    errores.contrasena = 'La contraseña no puede contener solo espacios.';
  }
  return errores;
}
