/** API administrativa real. Centraliza HTTP, paginación y errores controlados.
 * No reintenta escrituras: una respuesta perdida puede corresponder a un cambio
 * ya guardado. El servidor sigue siendo responsable del alcance y las relaciones.
 */
import axios from 'axios';
import api from './api';
import type { CuentaAdministrativa, PaginaRegistros, Recurso, RegistroAdministrativo } from '../modulos/administracion/datos-administracion';

export class ErrorAdministracion extends Error {
  campos: Record<string, string>;
  estado?: number;
  constructor(mensaje: string, campos: Record<string, string> = {}, estado?: number) {
    super(mensaje); this.campos = campos; this.estado = estado;
  }
}
export function errorAdministracion(error: unknown): ErrorAdministracion {
  if (error instanceof ErrorAdministracion) return error;
  if (!axios.isAxiosError(error)) return new ErrorAdministracion('La respuesta del servicio no tiene el formato esperado.');
  const estado = error.response?.status;
  const mensajes: Record<number, string> = {
    401: 'La sesión venció. Inicia sesión nuevamente.',
    403: 'Tu cuenta no tiene permiso para esta operación o empresa.',
    404: 'El registro ya no existe o no está disponible.',
    409: 'No se puede completar por registros relacionados o una asignación ocupada. Revisa sus dependencias.',
    422: 'Revisa los campos indicados. Puede haber datos inválidos, duplicados o asignaciones no permitidas.',
    429: 'Demasiadas solicitudes. Espera un momento y vuelve a intentar.',
  };
  const campos: Record<string, string> = {};
  if (estado === 422 && error.response?.data?.errors && typeof error.response.data.errors === 'object') {
    for (const clave of Object.keys(error.response.data.errors)) campos[clave] = 'Revisa este valor: puede ser inválido, estar duplicado o no estar disponible.';
  }
  return new ErrorAdministracion(estado ? mensajes[estado] ?? 'El servidor no pudo completar la operación. Revisa el listado antes de repetir un guardado.'
    : 'No se pudo confirmar la operación. Revisa la conexión y consulta el listado antes de repetir un guardado.', campos, estado);
}

function comprobarRegistro(registro: RegistroAdministrativo): RegistroAdministrativo {
  if (!registro || !Number.isSafeInteger(registro.id) || registro.id < 1) throw new ErrorAdministracion('El servidor devolvió un registro incompatible.');
  return registro;
}
function comprobarRespuesta<T>(respuesta: { success: boolean; data: T }): T {
  if (respuesta?.success !== true) throw new ErrorAdministracion('El servidor no confirmó la operación.');
  return respuesta.data;
}
export async function listarRegistros(recurso: Recurso, parametros: Record<string, string | number> = {}, signal?: AbortSignal): Promise<PaginaRegistros> {
  const respuesta = (await api.get<PaginaRegistros & { success: boolean }>(`/${recurso}`, { params: parametros, signal })).data;
  const registros = comprobarRespuesta(respuesta);
  if (!Array.isArray(registros) || !respuesta.meta || !Number.isInteger(respuesta.meta.last_page)) throw new ErrorAdministracion('No se pudo interpretar el listado.');
  return { data: registros.map(comprobarRegistro), meta: respuesta.meta };
}
/** Los selectores consumen todas las páginas, sin truncar catálogos a 15 registros. */
export async function cargarCatalogo(recurso: Recurso, empresaId: number, signal: AbortSignal): Promise<RegistroAdministrativo[]> {
  let pagina = 1;
  const registros: RegistroAdministrativo[] = [];
  while (true) {
    const respuesta = await listarRegistros(recurso, { empresa_id: empresaId, page: pagina, per_page: 100 }, signal);
    registros.push(...respuesta.data);
    if (pagina >= respuesta.meta.last_page) return registros;
    pagina += 1;
  }
}
export async function consultarRegistro(recurso: Recurso, id: number, signal?: AbortSignal): Promise<RegistroAdministrativo> {
  return comprobarRegistro(comprobarRespuesta((await api.get<{ success: boolean; data: RegistroAdministrativo }>(`/${recurso}/${id}`, { signal })).data));
}
export async function guardarRegistro(recurso: Recurso, datos: Record<string, unknown>, id?: number): Promise<RegistroAdministrativo> {
  const respuesta = id ? await api.put(`/${recurso}/${id}`, datos) : await api.post(`/${recurso}`, datos);
  return comprobarRegistro(comprobarRespuesta(respuesta.data));
}
export async function eliminarRegistro(recurso: Recurso, id: number): Promise<void> {
  comprobarRespuesta((await api.delete(`/${recurso}/${id}`)).data);
}
export async function cambiarEstadoRegistro(recurso: Recurso, id: number, estado: string | boolean): Promise<void> {
  const clave = recurso === 'micros' ? 'estado' : recurso === 'conductores' ? 'estado_operativo' : 'activo';
  comprobarRespuesta((await api.patch(`/${recurso}/${id}/estado`, { [clave]: estado })).data);
}
/** Solo administración general crea/edita cuentas de empresa. El rol se fija;
 * el formulario no permite elevar permisos ni gestionar pasajeros desde el panel.
 */
export async function guardarCuentaEmpresa(empresaId: number, datos: Record<string, string>, id?: number): Promise<CuentaAdministrativa> {
  const cuerpo: Record<string, unknown> = { ...datos, empresa_id: empresaId, rol: 'admin_empresa' };
  if (!datos.password) delete cuerpo.password;
  const respuesta = id ? await api.put(`/usuarios/${id}`, cuerpo) : await api.post('/usuarios', cuerpo);
  const cuenta = comprobarRespuesta<CuentaAdministrativa>(respuesta.data);
  if (!cuenta || !Number.isSafeInteger(cuenta.id) || cuenta.rol !== 'admin_empresa') throw new ErrorAdministracion('No se pudo verificar la cuenta administrativa.');
  return cuenta;
}
