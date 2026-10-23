/** Prueba explícita de escritura contra una API LOCAL. Crea datos ficticios y
 * elimina solo los IDs que ella misma creó. No ejecuta migraciones ni seeders.
 * Requiere GOTACNA_PROBAR_ESCRITURAS=1 y credenciales de un admin general local.
 */
import assert from 'node:assert/strict';
const base = process.env.GOTACNA_API ?? 'http://127.0.0.1:8001/api/v1';
const url = new URL(base);
if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || process.env.GOTACNA_PROBAR_ESCRITURAS !== '1') throw new Error('La prueba requiere autorización explícita y una API en loopback.');
if (!process.env.GOTACNA_ADMIN_CORREO || !process.env.GOTACNA_ADMIN_CLAVE) throw new Error('Faltan las credenciales del administrador local.');
const sufijo = String(Date.now());
const claveFicticia = `Prueba-${sufijo}`;
let token = '';
let tokenEmpresa = '';
let verificaciones = 0;
const creados = { empresas: [], rutas: [], conductores: [], micros: [], usuarios: [], perfiles: [] };
async function solicitar(metodo, ruta, datos, esperado = 200, sesion = token) {
  const respuesta = await fetch(`${base}${ruta}`, { method: metodo, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(sesion ? { Authorization: `Bearer ${sesion}` } : {}) }, body: datos === undefined ? undefined : JSON.stringify(datos) });
  const cuerpo = await respuesta.json();
  assert.equal(respuesta.status, esperado, `${metodo} ${ruta}: estado inesperado`);
  verificaciones += 1;
  if (esperado < 400) assert.equal(cuerpo.success, true);
  return cuerpo;
}
try {
  token = (await solicitar('POST', '/auth/login', { correo: process.env.GOTACNA_ADMIN_CORREO, password: process.env.GOTACNA_ADMIN_CLAVE }, 200, '')).data.token;
  const empresa = (await solicitar('POST', '/empresas', { ruc: `99${sufijo.slice(-9)}`, razon_social: `PRUEBA T059 ${sufijo}`, telefono: '000000000', direccion: 'Dirección ficticia de prueba' }, 201)).data;
  creados.empresas.push(empresa.id);
  const ajena = (await solicitar('POST', '/empresas', { ruc: `98${sufijo.slice(-9)}`, razon_social: `PRUEBA AJENA ${sufijo}`, telefono: '000000000', direccion: 'Dirección ficticia de prueba' }, 201)).data;
  creados.empresas.push(ajena.id);
  const correo = `t059-${sufijo}@example.com`;
  const cuenta = (await solicitar('POST', '/usuarios', { dni: `A${sufijo}`, nombre: 'Persona', apellido: 'Prueba', correo, telefono: '000000000', password: claveFicticia, rol: 'admin_empresa', empresa_id: empresa.id }, 201)).data;
  creados.usuarios.push(cuenta.id);
  creados.perfiles.push(...cuenta.administrador_empresa_perfiles.map(perfil => perfil.id));
  tokenEmpresa = (await solicitar('POST', '/auth/login', { correo, password: claveFicticia }, 200, '')).data.token;
  await solicitar('GET', `/empresas/${ajena.id}`, undefined, 403, tokenEmpresa);
  await solicitar('POST', '/empresas', { ruc: '00000000000', razon_social: 'Sin permiso', telefono: '0', direccion: 'Prueba' }, 403, tokenEmpresa);
  await solicitar('GET', '/usuarios', undefined, 403, tokenEmpresa);
  await solicitar('PUT', `/empresas/${empresa.id}`, { ruc: empresa.ruc, razon_social: `${empresa.razon_social} editada`, telefono: '000000001', direccion: empresa.direccion });
  await solicitar('PATCH', `/empresas/${empresa.id}/estado`, { activo: false });
  assert.equal((await solicitar('GET', `/empresas/${empresa.id}`)).data.activo, false);
  await solicitar('PATCH', `/empresas/${empresa.id}/estado`, { activo: true });
  const geometria = { type: 'LineString', coordinates: [[-70.2463, -18.0066], [-70.2451, -18.0048]] };
  const ruta = (await solicitar('POST', '/rutas', { empresa_id: empresa.id, nombre_ruta: `Ruta prueba ${sufijo}`, trazado_ruta: geometria }, 201, tokenEmpresa)).data;
  creados.rutas.push(ruta.id);
  await solicitar('PUT', `/rutas/${ruta.id}`, { nombre_ruta: `Ruta editada ${sufijo}`, trazado_ruta: geometria }, 200, tokenEmpresa);
  assert.deepEqual((await solicitar('GET', `/rutas/${ruta.id}`, undefined, 200, tokenEmpresa)).data.trazado_ruta.coordinates, geometria.coordinates);
  await solicitar('POST', '/rutas', { empresa_id: empresa.id, nombre_ruta: `Ruta editada ${sufijo}`, trazado_ruta: geometria }, 422, tokenEmpresa);
  await solicitar('PATCH', `/rutas/${ruta.id}/estado`, { activo: false }, 200, tokenEmpresa);
  await solicitar('PATCH', `/rutas/${ruta.id}/estado`, { activo: true }, 200, tokenEmpresa);
  await solicitar('POST', '/rutas', { empresa_id: ajena.id, nombre_ruta: 'Sin permiso', trazado_ruta: geometria }, 403, tokenEmpresa);
  const conductor = (await solicitar('POST', '/conductores', { empresa_id: empresa.id, dni: `C${sufijo}`, nombre: 'Conductor', apellido: 'Prueba', correo: `conductor-${sufijo}@example.com`, telefono: '000000000', password: claveFicticia, licencia_conducir: 'LICENCIA-PRUEBA' }, 201, tokenEmpresa)).data;
  creados.conductores.push(conductor.id); creados.usuarios.push(conductor.usuario_id);
  await solicitar('PUT', `/conductores/${conductor.id}`, { licencia_conducir: 'LICENCIA-EDITADA' }, 200, tokenEmpresa);
  assert.equal((await solicitar('GET', `/conductores/${conductor.id}`, undefined, 200, tokenEmpresa)).data.licencia_conducir, 'LICENCIA-EDITADA');
  const micro = (await solicitar('POST', '/micros', { empresa_id: empresa.id, placa: `P${sufijo}`, capacidad_pasajeros: 24, ruta_id: ruta.id, conductor_actual_id: conductor.id }, 201, tokenEmpresa)).data;
  creados.micros.push(micro.id);
  await solicitar('PUT', `/micros/${micro.id}`, { capacidad_pasajeros: 30 }, 200, tokenEmpresa);
  assert.equal((await solicitar('GET', `/micros/${micro.id}`, undefined, 200, tokenEmpresa)).data.capacidad_pasajeros, 30);
  await solicitar('POST', '/micros', { empresa_id: empresa.id, placa: `D${sufijo}`, conductor_actual_id: conductor.id }, 422, tokenEmpresa);
  await solicitar('DELETE', `/rutas/${ruta.id}`, undefined, 409, tokenEmpresa);
  await solicitar('DELETE', `/conductores/${conductor.id}`, undefined, 409, tokenEmpresa);
  await solicitar('DELETE', `/empresas/${empresa.id}`, undefined, 409);
  await solicitar('PATCH', `/micros/${micro.id}/estado`, { estado: 'en_recorrido' }, 200, tokenEmpresa);
  await solicitar('DELETE', `/micros/${micro.id}`, undefined, 409, tokenEmpresa);
  await solicitar('PUT', `/micros/${micro.id}`, { ruta_id: null }, 422, tokenEmpresa);
  await solicitar('PATCH', `/micros/${micro.id}/estado`, { estado: 'disponible' }, 200, tokenEmpresa);
  await solicitar('PATCH', `/conductores/${conductor.id}/estado`, { estado_operativo: 'disponible' }, 200, tokenEmpresa);
  await solicitar('POST', '/auth/logout', undefined, 200, tokenEmpresa);
  await solicitar('GET', '/conductores', undefined, 401, tokenEmpresa);
  tokenEmpresa = '';
  console.log(`${verificaciones} solicitudes verificadas: CRUD, persistencia, geometría, estados, permisos y dependencias.`);
} finally {
  // Orden inverso de dependencias. Nunca enumera ni elimina registros ajenos.
  for (const id of creados.micros.reverse()) { await solicitar('PATCH', `/micros/${id}/estado`, { estado: 'disponible' }); await solicitar('DELETE', `/micros/${id}`); }
  for (const id of creados.conductores.reverse()) await solicitar('DELETE', `/conductores/${id}`);
  for (const id of creados.rutas.reverse()) await solicitar('DELETE', `/rutas/${id}`);
  for (const id of creados.perfiles.reverse()) await solicitar('DELETE', `/administradores-empresa/${id}`);
  for (const id of creados.usuarios.reverse()) await solicitar('DELETE', `/usuarios/${id}`);
  for (const id of creados.empresas.reverse()) await solicitar('DELETE', `/empresas/${id}`);
  if (tokenEmpresa) await solicitar('POST', '/auth/logout', undefined, 200, tokenEmpresa);
  if (token) await solicitar('POST', '/auth/logout');
  console.log('Limpieza finalizada: se eliminaron únicamente los registros ficticios creados por esta ejecución.');
}
