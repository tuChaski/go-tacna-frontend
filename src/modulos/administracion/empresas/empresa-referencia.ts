/**
 * Ejemplo ficticio compartido por listado, detalle y edición de Empresas.
 * No contiene credenciales ni representa una respuesta de la API. El futuro
 * servicio deberá distinguir la empresa, el usuario y su vínculo administrativo.
 */
export const empresaReferencia = {
  id: 'andino-referencia',
  razonSocial: 'Andino Demo',
  ruc: 'DEMO0000001',
  telefonoEmpresa: '000 000 001',
  direccion: 'Dirección de demostración, Tacna',
  activa: true,
  dni: 'DEMO-DOC-ADMIN',
  nombre: 'Lucía',
  apellido: 'Demo',
  telefonoAdministrador: '000 000 002',
  correo: 'gestion@andino.example',
} as const;

export const rutaEmpresas = '/admin/preview/empresas';
