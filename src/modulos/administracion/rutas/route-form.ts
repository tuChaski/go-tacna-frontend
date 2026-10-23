/** Nombre y trazado del formulario, alineados con RutaRequest del backend.
 * El nombre conserva su clave local; la futura capa de servicio lo traducirá
 * a nombre_ruta y obtendrá empresa_id del contexto autorizado.
 */
import { validarTrazado } from './trazado-ruta.ts';
import type { PuntoRuta } from './trazado-ruta';

export interface RouteFormValues {
  name: string;
  trazado: PuntoRuta[];
}

export type RouteFormErrors = Partial<Record<keyof RouteFormValues, string>>;

export const routeFields: { key: 'name'; label: string; placeholder: string; help: string }[] = [
  { key: 'name', label: 'Nombre de la ruta', placeholder: 'Ej. Línea 10', help: 'Nombre con el que identificarás la ruta.' },
];

// Valida presencia, máximo publicado y geometría. La unicidad por empresa es remota.
export function validateRouteForm(values: RouteFormValues): RouteFormErrors {
  const errors: RouteFormErrors = {};
  for (const field of routeFields) {
    if (!values[field.key].trim()) errors[field.key] = `Completa el campo «${field.label}».`;
  }
  if ([...values.name.trim()].length > 180) errors.name = 'Utiliza como máximo 180 caracteres.';
  errors.trazado = validarTrazado(values.trazado);
  return errors;
}
