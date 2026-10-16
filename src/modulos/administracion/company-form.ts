export interface CompanyFormValues {
  name: string;
  ruc: string;
  email: string;
  password: string;
}

export type CompanyFormErrors = Partial<Record<keyof CompanyFormValues, string>>;

// Reglas de interfaz provisionales; los formatos oficiales se acordarán con la API.
export function validateCompanyForm(values: CompanyFormValues, creating: boolean): CompanyFormErrors {
  const errors: CompanyFormErrors = {};
  if (!values.name.trim()) errors.name = 'Ingresa la razón social.';
  if (!values.ruc.trim()) errors.ruc = 'Ingresa el RUC.';
  if (!values.email.trim()) errors.email = 'Ingresa el correo del administrador.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }
  // En edición, vacío conserva la contraseña; espacios son un intento inválido
  // de cambiarla. No se recorta una contraseña válida porque altera su contenido.
  if (creating && !values.password.trim()) errors.password = 'Ingresa una contraseña inicial.';
  else if (values.password.length > 0 && !values.password.trim()) {
    errors.password = 'La contraseña no puede contener solo espacios.';
  }
  return errors;
}
