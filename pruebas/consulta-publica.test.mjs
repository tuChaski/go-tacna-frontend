/** Contratos y fallos de T057. Los ejemplos son ficticios y el transporte se
 * controla para reproducir errores y respuestas tardías sin alterar la API. */
import test from 'node:test';
import assert from 'node:assert/strict';
import axios, { AxiosError } from 'axios';
import { adaptarRuta, adaptarMicro, adaptarPagina, adaptarDetalle } from '../src/modulos/consulta-publica/contrato-publico.ts';
import { crearConsultaPublica, mensajeConsulta } from '../src/modulos/consulta-publica/servicio-consulta.ts';
import { apiPublica } from '../src/services/api.ts';

const ruta = (id = 1) => ({ id, nombre_ruta: `Ruta ${id}`, activo: true, empresa: { razon_social: 'Empresa ficticia', activo: true }, trazado_ruta: { type: 'LineString', coordinates: [[-70.24, -18], [-70.25, -18.01]] } });
const micro = (id = 1) => ({ id, placa: `PRUEBA-${id}`, ruta_id: 1, estado: 'disponible', capacidad_pasajeros: 24, empresa: { razon_social: 'Empresa ficticia', activo: true }, ruta: { id: 1, activo: true } });
const pagina = (data, actual = 1, ultima = 1, total = data.length) => ({ success: true, data, meta: { current_page: actual, last_page: ultima, total } });
const signal = () => new AbortController().signal;

test('selecciona solo campos públicos, sin conservar identidad ni historial del conductor', () => {
  const original = { ...micro(), conductor_actual: { usuario: { dni: 'FICTICIO', correo: 'ficticio@example.com', password_hash: 'NO-REAL' } }, posiciones: [{ ubicacion: 'PRUEBA' }], ultima_posicion: {} };
  assert.deepEqual(Object.keys(adaptarMicro(original, 1)).sort(), ['id', 'placa', 'rutaId', 'estado', 'capacidad', 'empresa', 'posicion'].sort());
  assert.equal(adaptarMicro(original, 1).posicion, null);
  assert.ok(!JSON.stringify(adaptarMicro(original, 1)).includes('FICTICIO'));
  assert.deepEqual(Object.keys(adaptarRuta({ ...ruta(), micros: [original] })).sort(), ['id', 'nombre', 'empresa', 'coordenadas'].sort());
});
test('una ruta sin geometría sigue en el catálogo y no recibe un trazado inventado', () => {
  assert.deepEqual(adaptarRuta({ ...ruta(), trazado_ruta: null }).coordenadas, []);
});
test('descarta geometría incompatible sin impedir la consulta de la ruta', () => {
  for (const trazado of [{ type: 'Point', coordinates: [] }, { type: 'LineString', coordinates: [[Infinity, 0]] }, { type: 'LineString', coordinates: [[0, 91]] }, { type: 'LineString', coordinates: ['invalido'] }]) {
    const resultado = adaptarRuta({ ...ruta(), trazado_ruta: trazado });
    assert.deepEqual(resultado.coordenadas, []);
    assert.equal(resultado.trazadoInvalido, true);
  }
});
test('no presenta rutas inactivas ni empresas explícitamente inactivas', () => {
  assert.throws(() => adaptarRuta({ ...ruta(), activo: false }));
  assert.throws(() => adaptarRuta({ ...ruta(), empresa: { activo: false } }));
  assert.throws(() => adaptarMicro({ ...micro(), empresa: { activo: false } }, 1));
});
test('no mezcla micros de otra ruta ni unidades retiradas', () => {
  for (const cambios of [{ ruta_id: 2 }, { estado: 'inactivo' }, { estado: 'mantenimiento' }, { ruta: { id: 2, activo: true } }, { ruta: { id: 1, activo: false } }]) assert.throws(() => adaptarMicro({ ...micro(), ...cambios }, 1));
  assert.equal(adaptarMicro({ ...micro(), estado: 'en_recorrido' }, 1).estado, 'en_recorrido');
});
test('un dato opcional de capacidad ausente no se interpreta como ocupación', () => {
  assert.equal(adaptarMicro({ ...micro(), capacidad_pasajeros: null }, 1).capacidad, null);
});
test('conserva nombres largos y textos como contenido, sin transformarlos en HTML', () => {
  const nombre = '<img src=x onerror=alert(1)> ' + 'Ruta larga '.repeat(20);
  assert.equal(adaptarRuta({ ...ruta(), nombre_ruta: nombre }).nombre, nombre.trim());
});
test('catálogo vacío válido es diferente de respuesta incompleta o fallida', () => {
  assert.deepEqual(adaptarPagina(pagina([]), 1, adaptarRuta).registros, []);
  for (const valor of [null, {}, { success: false, data: [] }, { success: true, data: [], meta: {} }, { ...pagina([]), data: {} }]) assert.throws(() => adaptarPagina(valor, 1, adaptarRuta));
});
test('rechaza paginación incoherente, duplicados e identificadores inválidos', () => {
  for (const valor of [pagina([ruta()], 2), pagina([ruta()], 1, 1, -1), pagina([ruta(), ruta()]), pagina([{ ...ruta(), id: '1' }])]) assert.throws(() => adaptarPagina(valor, 1, adaptarRuta));
  assert.throws(() => adaptarDetalle({ success: true, data: ruta(2) }, 1, adaptarRuta));
});
test('permite acceder a páginas posteriores sin recortar sus resultados', async () => {
  const llamadas = [];
  const servicio = crearConsultaPublica({ get: async (url, config) => { llamadas.push([url, config.params]); return { data: pagina(Array.from({ length: 8 }, (_, i) => ruta(i + 9)), 2, 3, 20) }; } });
  const resultado = await servicio.rutas('  Centro  ', 2, signal());
  assert.equal(resultado.registros.length, 8);
  assert.equal(resultado.registros[0].id, 9);
  assert.deepEqual(llamadas[0], ['/rutas', { search: 'Centro', page: 2, per_page: 8 }]);
});
test('la consulta de micros filtra por ruta y respeta su página', async () => {
  let parametros;
  const servicio = crearConsultaPublica({ get: async (url, config) => { assert.equal(url, '/micros/activos'); parametros = config.params; return { data: pagina([micro()], 2, 2, 7) }; } });
  await servicio.micros(1, 2, signal());
  assert.deepEqual(parametros, { ruta_id: 1, page: 2, per_page: 6 });
});
test('valida búsquedas e identificadores antes de enviar solicitudes', async () => {
  let llamadas = 0;
  const servicio = crearConsultaPublica({ get: async () => { llamadas++; throw new Error('No debe enviarse'); } });
  await assert.rejects(servicio.rutas('x'.repeat(181), 1, signal()));
  await assert.rejects(servicio.rutas('', 0, signal()));
  await assert.rejects(servicio.micro(-1, 1, signal()));
  assert.equal(llamadas, 0);
});
test('una solicitud ya cancelada no se envía', async () => {
  const controlador = new AbortController(); controlador.abort();
  let llamadas = 0;
  const servicio = crearConsultaPublica({ get: async () => { llamadas++; return { data: pagina([]) }; } });
  await assert.rejects(servicio.rutas('', 1, controlador.signal), { name: 'AbortError' });
  assert.equal(llamadas, 0);
});
test('descarta la respuesta vieja aunque el transporte ignore la cancelación', async () => {
  let terminarVieja;
  const servicio = crearConsultaPublica({ get: async (_url, config) => config.params.search === 'vieja'
    ? new Promise(resolve => { terminarVieja = resolve; }) : { data: pagina([ruta(2)]) } });
  const controlador = new AbortController();
  const vieja = servicio.rutas('vieja', 1, controlador.signal);
  const rechazo = assert.rejects(vieja, { name: 'AbortError' });
  controlador.abort();
  const nueva = await servicio.rutas('nueva', 1, signal());
  terminarVieja({ data: pagina([ruta(1)]) }); await rechazo;
  assert.equal(nueva.registros[0].id, 2);
});
test('un fallo de conexión puede recuperarse sin sustituirlo por datos demo', async () => {
  let intentos = 0;
  const servicio = crearConsultaPublica({ get: async () => { if (++intentos === 1) throw new AxiosError('Red', 'ERR_NETWORK'); return { data: pagina([]) }; } });
  await assert.rejects(servicio.rutas('', 1, signal()));
  assert.equal((await servicio.rutas('', 1, signal())).total, 0);
});
for (const estado of [401, 403, 404, 429, 500]) test(`error HTTP ${estado} usa un mensaje público sin exponer la respuesta cruda`, () => {
  const error = new AxiosError('SQL y datos privados', undefined, undefined, undefined, { status: estado, data: { message: 'SQL privado' } });
  assert.ok(!mensajeConsulta(error).includes('SQL'));
  assert.ok(!mensajeConsulta(error).includes('Tu sesión terminó'));
});
test('distingue demora y conexión, sin instrucciones de guardado', () => {
  assert.match(mensajeConsulta(new AxiosError('demora', 'ECONNABORTED')), /demorando/);
  assert.match(mensajeConsulta(new AxiosError('red', 'ERR_NETWORK')), /conexión/);
});
test('el cliente público no envía Authorization ni consulta el almacenamiento de sesión', async () => {
  const anterior = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let lecturas = 0;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => { lecturas++; return 'token-privado-ficticio'; } } });
  const adapterAnterior = apiPublica.defaults.adapter;
  try {
    apiPublica.defaults.adapter = async config => {
      assert.equal(config.headers.get('Authorization'), undefined);
      return { status: 200, statusText: 'OK', config, headers: {}, data: pagina([ruta()]) };
    };
    await crearConsultaPublica(apiPublica).rutas('', 1, signal());
    assert.equal(lecturas, 0);
  } finally {
    apiPublica.defaults.adapter = adapterAnterior;
    if (anterior) Object.defineProperty(globalThis, 'localStorage', anterior); else delete globalThis.localStorage;
  }
});
test('el transporte HTTP conserva el AbortSignal de la lectura', async () => {
  const controlador = new AbortController();
  const cliente = axios.create({ adapter: async config => { assert.equal(config.signal, controlador.signal); return { status: 200, statusText: 'OK', config, headers: {}, data: { success: true, data: ruta() } }; } });
  assert.equal((await crearConsultaPublica(cliente).ruta(1, controlador.signal)).id, 1);
});
