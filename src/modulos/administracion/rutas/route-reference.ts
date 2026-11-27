import type { RouteFormValues } from './route-form';

export const companyPreviewPath = '/admin/preview/empresa';
export const routesPreviewPath = `${companyPreviewPath}/rutas`;

/** Ejemplo inmutable. Los puntos ilustran la edición en Tacna; no representan
 * una línea de transporte verificada ni un recorrido recuperado de la API.
 */
export const referenceRoute: Readonly<RouteFormValues & { id: string; active: boolean }> = {
  id: 'linea-10-referencia',
  name: 'Línea 10',
  trazado: [
    { latitud: -18.0066, longitud: -70.2463 },
    { latitud: -18.0048, longitud: -70.2451 },
    { latitud: -18.0031, longitud: -70.2438 },
    { latitud: -18.0014, longitud: -70.2425 },
  ],
  active: true,
};
