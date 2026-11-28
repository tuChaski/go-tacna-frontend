/** Configurar solo un canal institucional autorizado. Nunca usar datos de
 * cuentas administrativas. Mientras sea null, no se publica ningún botón. */
export const contactoPublico: { telefono: string | null; whatsapp: boolean } = {
  telefono: null,
  whatsapp: false,
};
export function enlacesContacto(contacto = contactoPublico) {
  if (!contacto.telefono || !/^\+[1-9]\d{7,14}$/.test(contacto.telefono)) return null;
  return { llamada: `tel:${contacto.telefono}`,
    whatsapp: contacto.whatsapp ? `https://wa.me/${contacto.telefono.slice(1)}` : null };
}
