/**
 * Campos y reglas locales de Empresas y de su cuenta administrativa.
 * Refleja EmpresaRequest/UsuarioRequest; no es un payload ni comprueba unicidad.
 * Los teléfonos se distinguen para evitar confundir el contacto de la empresa
 * con el de la persona que administrará su cuenta.
 */
export interface DatosFormularioEmpresa {
  razonSocial: string;
  ruc: string;
  telefonoEmpresa: string;
  direccion: string;
  dni: string;
  nombre: string;
  apellido: string;
  telefonoAdministrador: string;
  correo: string;
  contrasena: string;
}

export type ErroresEmpresa = Partial<Record<keyof DatosFormularioEmpresa, string>>;

interface CampoEmpresa {
  clave: Exclude<keyof DatosFormularioEmpresa, 'contrasena'>;
  etiqueta: string;
  limite: number;
  tipo: 'text' | 'tel' | 'email';
  ayuda: string;
}

// El orden se comparte entre formulario, detalle y enfoque del primer error.
export const camposEmpresa: CampoEmpresa[] = [
  { clave: 'razonSocial', etiqueta: 'Razón social', limite: 180, tipo: 'text', ayuda: 'Nombre con el que se registra la empresa.' },
  { clave: 'ruc', etiqueta: 'RUC', limite: 11, tipo: 'text', ayuda: 'Identificador de la empresa, de 11 caracteres.' },
  { clave: 'telefonoEmpresa', etiqueta: 'Teléfono de la empresa', limite: 30, tipo: 'tel', ayuda: 'Número de contacto de la empresa.' },
  { clave: 'direccion', etiqueta: 'Dirección', limite: 255, tipo: 'text', ayuda: 'Dirección de contacto de la empresa.' },
];

export const camposAdministrador: CampoEmpresa[] = [
  { clave: 'dni', etiqueta: 'DNI del administrador', limite: 20, tipo: 'text', ayuda: 'Documento de la persona responsable de la cuenta.' },
  { clave: 'nombre', etiqueta: 'Nombres', limite: 120, tipo: 'text', ayuda: 'Nombres del administrador de la empresa.' },
  { clave: 'apellido', etiqueta: 'Apellidos', limite: 120, tipo: 'text', ayuda: 'Apellidos del administrador de la empresa.' },
  { clave: 'telefonoAdministrador', etiqueta: 'Teléfono del administrador', limite: 30, tipo: 'tel', ayuda: 'Contacto personal del administrador.' },
  { clave: 'correo', etiqueta: 'Correo del administrador', limite: 150, tipo: 'email', ayuda: 'Se utilizará para iniciar sesión.' },
];

export function validarEmpresa(datos: DatosFormularioEmpresa, creando: boolean): ErroresEmpresa {
  const errores: ErroresEmpresa = {};
  for (const campo of [...camposEmpresa, ...camposAdministrador]) {
    const valor = datos[campo.clave].trim();
    if (!valor) errores[campo.clave] = `Completa el campo «${campo.etiqueta}».`;
    else if ([...valor].length > campo.limite) errores[campo.clave] = `Utiliza como máximo ${campo.limite} caracteres.`;
  }
  // El contrato exige tamaño, no un patrón numérico ni verificación tributaria.
  if (datos.ruc.trim() && [...datos.ruc.trim()].length !== 11) errores.ruc = 'El RUC debe tener 11 caracteres.';
  if (datos.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())) {
    errores.correo = 'Ingresa un correo electrónico válido.';
  }
  // Vacío en edición conserva la contraseña. Nunca se recorta su contenido.
  if (creando && !datos.contrasena) errores.contrasena = 'Ingresa una contraseña inicial.';
  else if (datos.contrasena && !datos.contrasena.trim()) errores.contrasena = 'La contraseña no puede contener solo espacios.';
  else if (datos.contrasena && [...datos.contrasena].length < 8) errores.contrasena = 'Utiliza al menos 8 caracteres.';
  return errores;
}
