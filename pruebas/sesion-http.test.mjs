/** T102: peticiones Axios reales con adaptador sin red y reloj controlado. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import axios, { AxiosError } from 'axios';
import { instalarSesionHttp, demoraRenovacion, ErrorSesion } from '../src/services/sesion-http.ts';
import { adaptarRenovacion } from '../src/services/adaptador-autenticacion.ts';
import { mensajeErrorHttp } from '../src/services/errores-http.ts';

const ahora = 1_800_000_000_000;
let consecutivo = 0;
function jwt(segundos = 3600) {
  const codificar = datos => Buffer.from(JSON.stringify(datos)).toString('base64url');
  return `${codificar({ alg: 'HS256' })}.${codificar({ exp: ahora / 1000 + segundos, iat: ahora / 1000 - 3600, jti: ++consecutivo })}.firma-ficticia`;
}
function responder(config, estado = 200, data = {}) {
  const respuesta = { config, status: estado, statusText: String(estado), headers: {}, data };
  return estado < 400 ? Promise.resolve(respuesta)
    : Promise.reject(new AxiosError('Fallo simulado', 'ERR_BAD_RESPONSE', config, {}, respuesta));
}
function diferida() {
  let resolver;
  let rechazar;
  const promesa = new Promise((ok, fallo) => { resolver = ok; rechazar = fallo; });
  return { promesa, resolver, rechazar };
}
const avanzar = () => new Promise(resolve => setImmediate(resolve));
function preparar({ token = jwt(), renovar = async () => jwt(), adaptador = config => responder(config), coordinar } = {}) {
  const peticiones = [];
  const renovaciones = [];
  const salidas = [];
  let cambios = 0;
  const almacen = { token };
  const cliente = axios.create({ adapter: config => { peticiones.push(config); return adaptador(config); } });
  const sesion = instalarSesionHttp(cliente, {
    leerToken: () => almacen.token,
    escribirToken: valor => { almacen.token = valor; },
    avisarToken: () => { cambios++; },
    avisarSalida: motivo => salidas.push(motivo),
    renovar: (valor, signal) => { renovaciones.push(valor); return renovar(valor, signal); },
    coordinar,
    ahora: () => ahora,
  });
  return { cliente, sesion, almacen, peticiones, renovaciones, salidas, cambios: () => cambios };
}

test('el refresh interpreta token y tipo sin exigir usuario', () => {
  assert.equal(adaptarRenovacion({ success: true, data: { token: 'token', tipo: 'bearer' } }), 'token');
  for (const data of [{}, { token: '', tipo: 'bearer' }, { token: 'token', tipo: 'otro' }]) {
    assert.throws(() => adaptarRenovacion({ success: true, data }));
  }
});
test('la anticipación usa exp, admite TTL cortos y rechaza datos incompatibles', () => {
  assert.equal(demoraRenovacion(jwt(3600), ahora), 3_540_000);
  assert.equal(demoraRenovacion('incompatible', ahora), null);
  const corto = `e30.${Buffer.from(JSON.stringify({ iat: ahora/1000, exp: ahora/1000+60 })).toString('base64url')}.firma`;
  assert.equal(demoraRenovacion(corto, ahora), 48_000);
});
test('la consulta pública sin sesión no envía Authorization', async () => {
  const p = preparar({ token: null });
  await p.cliente.get('/rutas');
  assert.equal(p.peticiones[0].headers.get('Authorization'), undefined);
  assert.equal(p.renovaciones.length, 0);
});
test('una sesión vigente conserva el token sin renovaciones innecesarias', async () => {
  const p = preparar(); const token = p.almacen.token;
  await p.cliente.get('/auth/me');
  assert.equal(p.peticiones[0].headers.get('Authorization'), `Bearer ${token}`);
  assert.equal(p.renovaciones.length, 0);
});
test('renueva antes de enviar una escritura y la envía exactamente una vez', async () => {
  const p = preparar({ token: jwt(30) }); const anterior = p.almacen.token;
  await p.cliente.post('/micros', { placa: 'FICTICIA' });
  assert.equal(p.renovaciones.length, 1); assert.equal(p.peticiones.length, 1);
  assert.notEqual(p.almacen.token, anterior); assert.equal(p.cambios(), 1);
  assert.equal(p.peticiones[0].headers.get('Authorization'), `Bearer ${p.almacen.token}`);
});
test('tres solicitudes simultáneas comparten una renovación y usan el token nuevo', async () => {
  const d = diferida(); const nuevo = jwt();
  const p = preparar({ token: jwt(30), renovar: () => d.promesa });
  const solicitudes = ['/micros', '/rutas', '/conductores'].map(ruta => p.cliente.get(ruta));
  await avanzar(); assert.equal(p.renovaciones.length, 1); assert.equal(p.peticiones.length, 0);
  d.resolver(nuevo); await Promise.all(solicitudes);
  assert.equal(p.peticiones.length, 3);
  assert.ok(p.peticiones.every(c => c.headers.get('Authorization') === `Bearer ${nuevo}`));
});
for (const [nombre, fallo] of [
  ['desconexión', () => new AxiosError('Sin red', 'ERR_NETWORK')],
  ['timeout', () => new AxiosError('Demora', 'ECONNABORTED')],
  ['servidor 500', () => new AxiosError('Error', 'ERR_BAD_RESPONSE', undefined, undefined, { status: 500 })],
]) test(`fallo de renovación por ${nombre} conserva la sesión y no envía la escritura`, async () => {
  const p = preparar({ token: jwt(30), renovar: async () => { throw fallo(); } });
  const anterior = p.almacen.token;
  await assert.rejects(p.cliente.post('/micros', {}));
  assert.equal(p.almacen.token, anterior); assert.equal(p.salidas.length, 0); assert.equal(p.peticiones.length, 0);
});
for (const estado of [401, 403]) test(`refresh rechazado con ${estado} termina la sesión sin bucle`, async () => {
  const p = preparar({ token: jwt(30), renovar: async () => { throw new AxiosError('Rechazo', '', undefined, undefined, { status: estado }); } });
  await assert.rejects(p.cliente.get('/micros'));
  assert.equal(p.almacen.token, null); assert.equal(p.salidas.length, 1); assert.equal(p.renovaciones.length, 1);
});
test('un token vencido requiere login sin intentar refresh que el backend rechaza', async () => {
  const p = preparar({ token: jwt(-1) });
  await assert.rejects(p.cliente.get('/micros'), ErrorSesion);
  assert.equal(p.renovaciones.length, 0); assert.equal(p.peticiones.length, 0); assert.equal(p.almacen.token, null);
});
test('cerrar sesión cancela una renovación pendiente y no resucita la cuenta', async () => {
  const d = diferida(); let signal;
  const p = preparar({ token: jwt(30), renovar: (_, s) => { signal = s; return d.promesa; } });
  const solicitud = p.cliente.get('/auth/me');
  const rechazo = assert.rejects(solicitud, error => axios.isCancel(error));
  await avanzar(); const anterior = p.sesion.cerrarLocalmente();
  assert.ok(anterior); assert.equal(signal.aborted, true);
  d.resolver(jwt()); await rechazo;
  assert.equal(p.almacen.token, null); assert.equal(p.peticiones.length, 0);
});
test('una renovación antigua no reemplaza una nueva sesión', async () => {
  const d = diferida(); const p = preparar({ token: jwt(30), renovar: () => d.promesa });
  const solicitud = p.cliente.get('/micros');
  const rechazo = assert.rejects(solicitud, error => axios.isCancel(error));
  await avanzar(); const nuevaSesion = jwt(); p.sesion.guardarSesion(nuevaSesion);
  d.resolver(jwt()); await rechazo;
  assert.equal(p.almacen.token, nuevaSesion); assert.equal(p.salidas.length, 0);
});
for (const tipo of ['mismo', 'vencido', 'incompatible']) test(`una respuesta de refresh con token ${tipo} no se acepta`, async () => {
  const anterior = jwt(30);
  const p = preparar({ token: anterior, renovar: async () => tipo === 'mismo' ? anterior : tipo === 'vencido' ? jwt(-1) : 'incompatible' });
  await assert.rejects(p.cliente.get('/micros'), ErrorSesion);
  assert.equal(p.almacen.token, null); assert.equal(p.peticiones.length, 0);
});
test('una lectura con 401 del token anterior se recupera una sola vez tras rotación', async () => {
  const d = diferida(); let cuenta = 0;
  const p = preparar({ adaptador: config => ++cuenta === 1 ? d.promesa : responder(config) });
  const solicitud = p.cliente.get('/micros'); await avanzar();
  p.almacen.token = jwt(); d.rechazar(new AxiosError('Viejo', '', p.peticiones[0], undefined, { status: 401 }));
  await solicitud;
  assert.equal(cuenta, 2); assert.equal(p.salidas.length, 0);
  assert.equal(p.peticiones[1].headers.get('Authorization'), `Bearer ${p.almacen.token}`);
});
test('si la lectura recuperada vuelve a dar 401 termina sin un tercer envío', async () => {
  const d = diferida(); let cuenta = 0;
  const p = preparar({ adaptador: config => ++cuenta === 1 ? d.promesa : responder(config, 401) });
  const solicitud = p.cliente.get('/micros'); const rechazo = assert.rejects(solicitud);
  await avanzar(); p.almacen.token = jwt(); d.rechazar(new AxiosError('Viejo', '', p.peticiones[0], undefined, { status: 401 }));
  await rechazo; assert.equal(cuenta, 2); assert.equal(p.almacen.token, null);
});
test('una escritura con respuesta 401 antigua no se repite ni cierra la sesión nueva', async () => {
  const d = diferida(); const p = preparar({ adaptador: () => d.promesa });
  const solicitud = p.cliente.post('/micros', {}); const rechazo = assert.rejects(solicitud);
  await avanzar(); const nuevo = jwt(); p.almacen.token = nuevo;
  d.rechazar(new AxiosError('Viejo', '', p.peticiones[0], undefined, { status: 401 }));
  await rechazo; assert.equal(p.peticiones.length, 1); assert.equal(p.almacen.token, nuevo);
});
for (const estado of [200, 401]) test(`una respuesta ${estado} de otra sesión se descarta`, async () => {
  const d = diferida(); const p = preparar({ adaptador: () => d.promesa });
  const solicitud = p.cliente.get('/micros'); const rechazo = assert.rejects(solicitud, error => axios.isCancel(error));
  await avanzar(); const nuevo = jwt(); p.sesion.guardarSesion(nuevo);
  if (estado === 200) d.resolver({ config: p.peticiones[0], status: 200, data: {}, headers: {} });
  else d.rechazar(new AxiosError('Viejo', '', p.peticiones[0], undefined, { status: 401 }));
  await rechazo; assert.equal(p.almacen.token, nuevo); assert.equal(p.salidas.length, 0);
});
for (const ruta of ['/auth/login', '/auth/register']) test(`credenciales incorrectas en ${ruta} no provocan refresh ni invalidación`, async () => {
  const p = preparar({ token: jwt(30), adaptador: config => responder(config, 401) }); const anterior = p.almacen.token;
  await assert.rejects(p.cliente.post(ruta, {}));
  assert.equal(p.renovaciones.length, 0); assert.equal(p.almacen.token, anterior);
  assert.equal(p.peticiones[0].headers.get('Authorization'), undefined);
});
for (const estado of [403, 422, 429, 500]) test(`un error ${estado} de negocio no renueva ni cierra una sesión vigente`, async () => {
  const p = preparar({ adaptador: config => responder(config, estado) }); const anterior = p.almacen.token;
  await assert.rejects(p.cliente.post('/micros', {}));
  assert.equal(p.renovaciones.length, 0); assert.equal(p.salidas.length, 0); assert.equal(p.almacen.token, anterior);
});
test('cancelar una consulta no cancela la renovación que necesitan otras', async () => {
  const d = diferida(); const aborto = new AbortController();
  const p = preparar({ token: jwt(30), renovar: () => d.promesa });
  const a = p.cliente.get('/rutas', { signal: aborto.signal });
  const rechazo = assert.rejects(a, error => axios.isCancel(error));
  const b = p.cliente.get('/micros'); await avanzar(); aborto.abort(); d.resolver(jwt());
  await Promise.all([rechazo, b]);
  assert.equal(p.renovaciones.length, 1); assert.equal(p.peticiones.length, 1);
});
test('reutiliza el token que otra pestaña renovó durante la espera del bloqueo', async () => {
  const nuevo = jwt(); let p;
  p = preparar({ token: jwt(30), coordinar: async trabajo => { p.almacen.token = nuevo; return trabajo(); } });
  await p.cliente.get('/micros');
  assert.equal(p.renovaciones.length, 0); assert.equal(p.peticiones[0].headers.get('Authorization'), `Bearer ${nuevo}`);
});
test('los mensajes globales distinguen permiso, validación, demora y conexión', () => {
  const error = estado => new AxiosError('Mensaje crudo privado', '', undefined, undefined, { status: estado });
  assert.match(mensajeErrorHttp(error(403)), /permiso/); assert.match(mensajeErrorHttp(error(422)), /campos/);
  assert.match(mensajeErrorHttp(new AxiosError('', 'ECONNABORTED')), /demorando/);
  assert.match(mensajeErrorHttp(new AxiosError('', 'ERR_NETWORK')), /conexión/);
  for (const estado of [401,403,404,409,422,429,500]) assert.doesNotMatch(mensajeErrorHttp(error(estado)), /crudo|privado/);
});
test('un 409 muestra el motivo de negocio del servidor; otros estados no exponen su mensaje', () => {
  const conMotivo = (estado, message) => new AxiosError('', '', undefined, undefined, { status: estado, data: { success: false, message } });
  assert.equal(mensajeErrorHttp(conMotivo(409, ' No puedes eliminar una ruta que tiene micros asignados. ')), 'No puedes eliminar una ruta que tiene micros asignados.');
  assert.match(mensajeErrorHttp(conMotivo(409, '')), /registros relacionados/);
  assert.match(mensajeErrorHttp(conMotivo(409, { detalle: 'objeto' })), /registros relacionados/);
  for (const estado of [403, 404, 422, 500]) assert.doesNotMatch(mensajeErrorHttp(conMotivo(estado, 'Mensaje crudo privado')), /crudo|privado/);
});
