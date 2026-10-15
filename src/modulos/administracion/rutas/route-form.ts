/** Modelo del formulario; todavía no es un contrato de la API. */
export interface RouteFormValues {
  name: string;
  originDestination: string;
  startReference: string;
  endReference: string;
}

export type RouteFormErrors = Partial<Record<keyof RouteFormValues, string>>;

export const routeFields: { key: keyof RouteFormValues; label: string; placeholder: string; help: string }[] = [
  { key: 'name', label: 'Nombre de la ruta', placeholder: 'Ej. Línea 10', help: 'Nombre con el que identificarás la ruta.' },
  { key: 'originDestination', label: 'Origen y destino', placeholder: 'Ej. Centro → Ciudad Nueva', help: 'Indica las zonas que conecta el recorrido.' },
  { key: 'startReference', label: 'Referencia inicial', placeholder: 'Ej. Plaza de Armas', help: 'Lugar de referencia al inicio del recorrido.' },
  { key: 'endReference', label: 'Referencia final', placeholder: 'Ej. Ciudad Nueva', help: 'Lugar de referencia al final del recorrido.' },
];

// Se comprueba presencia. Unicidad y restricciones de operación requieren la API.
export function validateRouteForm(values: RouteFormValues): RouteFormErrors {
  const errors: RouteFormErrors = {};
  for (const field of routeFields) {
    if (!values[field.key].trim()) errors[field.key] = `Completa el campo «${field.label}».`;
  }
  return errors;
}
