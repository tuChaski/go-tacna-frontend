import type { RouteFormValues } from './route-form';

export const companyPreviewPath = '/admin/preview/empresa';
export const routesPreviewPath = `${companyPreviewPath}/rutas`;

/** Ejemplo inmutable: no representa una ruta recuperada del servidor. */
export const referenceRoute: Readonly<RouteFormValues & { id: string; active: boolean }> = {
  id: 'linea-10-referencia',
  name: 'Línea 10',
  originDestination: 'Centro → Ciudad Nueva',
  startReference: 'Plaza de Armas',
  endReference: 'Ciudad Nueva',
  active: true,
};
