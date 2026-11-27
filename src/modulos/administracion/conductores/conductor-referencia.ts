/** Referencia inmutable de T053. Nunca contiene una contraseña ni datos de la API. */
import { companyPreviewPath } from '../rutas/route-reference';

export const rutaConductores = `${companyPreviewPath}/conductores`;

export const conductorReferencia = {
  id: 'carlos-referencia',
  nombreCompleto: 'Carlos Pérez',
  documento: 'DEMO-DOC-001',
  correo: 'carlos@andino.example',
  activo: true,
} as const;

/** Normaliza solo la búsqueda visual, sin alterar lo escrito en el formulario. */
export function normalizarBusqueda(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
}
