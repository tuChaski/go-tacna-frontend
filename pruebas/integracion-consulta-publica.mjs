/** Verificación de solo lectura contra una API local. No requiere credenciales,
 * no crea registros y nunca imprime los cuerpos que contienen datos personales. */
import assert from 'node:assert/strict';
import axios from 'axios';
import { crearConsultaPublica } from '../src/modulos/consulta-publica/servicio-consulta.ts';

const baseURL = process.env.GOTACNA_API ?? 'http://127.0.0.1:8001/api/v1';
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(baseURL).hostname)) throw new Error('La integración solo admite una API local.');
const http = axios.create({ baseURL, timeout: 15000 });
let solicitudes = 0;
let respuestasConDatosPersonales = 0;
http.interceptors.request.use(config => {
  assert.ok(!config.headers.get('Authorization'), 'La consulta no debe transmitir credenciales');
  solicitudes++;
  return config;
});
http.interceptors.response.use(respuesta => {
  const registros = Array.isArray(respuesta.data?.data) ? respuesta.data.data : [respuesta.data?.data];
  if (registros.some(registro => registro?.conductor_actual?.usuario && ['dni', 'correo', 'telefono'].some(campo => campo in registro.conductor_actual.usuario))) respuestasConDatosPersonales++;
  return respuesta;
});
const servicio = crearConsultaPublica(http);
const signal = () => new AbortController().signal;
const primera = await servicio.rutas('', 1, signal());
const idsRutas = new Set();
let unidadesConsultadas = 0;
for (let numero = 1; numero <= primera.ultima; numero++) {
  const pagina = numero === 1 ? primera : await servicio.rutas('', numero, signal());
  for (const ruta of pagina.registros) {
    assert.ok(!idsRutas.has(ruta.id)); idsRutas.add(ruta.id);
    assert.equal((await servicio.ruta(ruta.id, signal())).id, ruta.id);
    const micros = await servicio.micros(ruta.id, 1, signal());
    for (let paginaMicro = 1; paginaMicro <= micros.ultima; paginaMicro++) {
      const lote = paginaMicro === 1 ? micros : await servicio.micros(ruta.id, paginaMicro, signal());
      for (const unidad of lote.registros) {
        const detalle = await servicio.micro(unidad.id, ruta.id, signal());
        assert.equal(detalle.rutaId, ruta.id);
        assert.equal(Object.hasOwn(detalle, 'conductor_actual'), false);
        assert.equal(Object.hasOwn(detalle, 'posiciones'), false);
        unidadesConsultadas++;
      }
    }
  }
}
assert.equal(idsRutas.size, primera.total);
if (primera.registros.length) {
  const nombre = primera.registros[0].nombre;
  assert.ok((await servicio.rutas(nombre, 1, signal())).registros.some(ruta => ruta.nombre === nombre));
}
assert.equal((await servicio.rutas(`SIN-COINCIDENCIA-T057-${Date.now()}`, 1, signal())).total, 0);
assert.equal((await servicio.micros(2147483647, 1, signal())).total, 0);
await assert.rejects(servicio.ruta(2147483647, signal()), error => error.response?.status === 404);
await assert.rejects(servicio.micro(2147483647, 1, signal()), error => error.response?.status === 404);
for (const ruta of ['/empresas', '/conductores']) await assert.rejects(http.get(ruta), error => error.response?.status === 401);
// Fuerza dos páginas pequeñas con el catálogo existente, sin crear datos.
if (primera.total > 1) {
  const una = (await http.get('/rutas', { params: { per_page: 1, page: 1 } })).data;
  const dos = (await http.get('/rutas', { params: { per_page: 1, page: 2 } })).data;
  assert.equal(una.meta.current_page, 1); assert.equal(dos.meta.current_page, 2);
  assert.notEqual(una.data[0].id, dos.data[0].id);
}
console.log(`${solicitudes} solicitudes sin token verificadas: catálogo completo, búsqueda, detalles, filtros, paginación, vacíos, 404 y protección administrativa.`);
console.log(`${idsRutas.size} rutas y ${unidadesConsultadas} unidades consultadas. No se modificaron registros.`);
if (respuestasConDatosPersonales) console.log('PENDIENTE BACKEND: la API pública incluye datos personales del conductor. El adaptador no los conserva; se debe corregir el recurso público del servidor antes de publicar.');
