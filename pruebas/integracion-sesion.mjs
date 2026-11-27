/** Integración T102 exclusivamente en loopback. Usa tres JWT de prueba emitidos
 * por la API local (vigente, próximo a vencer y vencido). No crea registros,
 * no modifica cuentas y no muestra tokens. Cierra los tokens de prueba al final.
 */
import assert from 'node:assert/strict';
import axios from 'axios';
import { instalarSesionHttp, ErrorSesion } from '../src/services/sesion-http.ts';
import { adaptarRenovacion } from '../src/services/adaptador-autenticacion.ts';

const baseURL = process.env.GOTACNA_API ?? 'http://127.0.0.1:8001/api/v1';
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(baseURL).hostname)) {
  throw new Error('Esta prueba solo admite una API local en loopback.');
}
const { GOTACNA_TOKEN_VIGENTE: vigente, GOTACNA_TOKEN_CORTO: corto, GOTACNA_TOKEN_VENCIDO: vencido,
  GOTACNA_ROL_PRUEBA: rol } = process.env;
if (!vigente || !corto || !vencido || !rol) throw new Error('Faltan los JWT temporales y el rol esperado de la prueba local.');

const api = axios.create({ baseURL, timeout: 15000 });
const raw = axios.create({ baseURL, timeout: 15000 });
let token = vigente;
let renovaciones = 0;
let salidas = 0;
let verificaciones = 0;
const emitidos = new Set([vigente, corto]);
const headers = valor => ({ Authorization: `Bearer ${valor}` });
const comprobarEstado = async (solicitud, estado) => {
  await assert.rejects(solicitud, error => axios.isAxiosError(error) && error.response?.status === estado);
  verificaciones++;
};
const sesion = instalarSesionHttp(api, {
  leerToken: () => token,
  escribirToken: valor => { token = valor; if (valor) emitidos.add(valor); },
  avisarToken: () => {},
  avisarSalida: () => { salidas++; },
  renovar: async (anterior, signal) => {
    renovaciones++;
    return adaptarRenovacion((await raw.post('/auth/refresh', {}, { headers: headers(anterior), signal })).data);
  },
});

try {
  const perfil = (await api.get('/auth/me')).data.data;
  assert.equal(perfil.rol, rol); assert.equal(renovaciones, 0); verificaciones++;
  const alcance = perfil.administrador_empresa_perfiles?.map(p => p.empresa_id).sort();
  sesion.guardarSesion(corto);
  const resultados = await Promise.all(['/rutas', '/micros', '/conductores'].map(ruta => api.get(ruta)));
  assert.ok(resultados.every(r => r.status === 200)); assert.equal(renovaciones, 1); verificaciones++;
  assert.notEqual(token, corto); verificaciones++;
  await comprobarEstado(raw.get('/auth/me', { headers: headers(corto) }), 401);
  const nuevoPerfil = (await api.get('/auth/me')).data.data;
  assert.equal(nuevoPerfil.id, perfil.id); assert.equal(nuevoPerfil.rol, rol);
  assert.deepEqual(nuevoPerfil.administrador_empresa_perfiles?.map(p => p.empresa_id).sort(), alcance); verificaciones++;
  await comprobarEstado(api.get('/conductor/perfil'), 403);
  await comprobarEstado(api.post('/auth/login', {}), 422);
  await comprobarEstado(api.post('/auth/login', { correo: 't102-inexistente@example.invalid', password: 'Ficticia incorrecta' }), 401);
  assert.equal(salidas, 0); assert.equal(renovaciones, 1); verificaciones++;
  const renovado = token;
  assert.equal(sesion.cerrarLocalmente(), renovado);
  assert.equal((await raw.post('/auth/logout', {}, { headers: headers(renovado) })).status, 200); verificaciones++;
  await comprobarEstado(raw.get('/auth/me', { headers: headers(renovado) }), 401);
  sesion.guardarSesion(vencido);
  await assert.rejects(api.get('/auth/me'), ErrorSesion);
  assert.equal(token, null); assert.equal(renovaciones, 1); verificaciones++;
  await comprobarEstado(raw.post('/auth/refresh', {}, { headers: headers(vencido) }), 401);
  console.log(JSON.stringify({ rol, verificaciones, renovaciones, resultado: 'correcto' }));
} catch (error) {
  // Axios incluye cabeceras en su objeto de error: nunca se imprime ese objeto.
  console.error(JSON.stringify({ rol, verificaciones, resultado: 'fallo', estado: axios.isAxiosError(error) ? error.response?.status : undefined }));
  process.exitCode = 1;
} finally {
  sesion.desmontar();
  for (const temporal of emitidos) {
    try { await raw.post('/auth/logout', {}, { headers: headers(temporal) }); } catch { /* Puede estar invalidado por una renovación o logout anterior. */ }
  }
}
