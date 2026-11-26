/** Servidor desechable para probar la interfaz sin tocar Laravel. Solo escucha
 * en loopback y exige activación explícita. Nunca se usa desde producción. */
import { createServer } from 'node:http';
if (process.env.GOTACNA_SERVIDOR_FICTICIO !== '1') throw new Error('Activa GOTACNA_SERVIDOR_FICTICIO=1 para ejecutar este servidor de prueba.');
const rutas = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1, nombre_ruta: `Ruta ${String(i + 1).padStart(2, '0')} · Tacna de prueba`, activo: true,
  empresa: { razon_social: 'Empresa ficticia para T057', activo: true },
  trazado_ruta: i === 1 ? null : { type: 'LineString', coordinates: [[-70.24, -18], [-70.25, -18.01]] },
}));
function paginar(datos, url) {
  const porPagina = Math.max(1, Number(url.searchParams.get('per_page') ?? 8));
  const pagina = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  return { success: true, data: datos.slice((pagina - 1) * porPagina, pagina * porPagina), meta: { current_page: pagina, last_page: Math.max(1, Math.ceil(datos.length / porPagina)), total: datos.length } };
}
function unidades(rutaId) {
  if (rutaId === 2) return [];
  return Array.from({ length: rutaId === 1 ? 7 : 1 }, (_, i) => ({
    id: rutaId * 100 + i + 1, placa: `FICTICIO-${rutaId}-${i + 1}`, ruta_id: rutaId,
    capacidad_pasajeros: 24, estado: i % 2 ? 'en_recorrido' : 'disponible',
    empresa: rutas[0].empresa, ruta: { id: rutaId, activo: true },
  }));
}
const servidor = createServer(async (peticion, respuesta) => {
  respuesta.setHeader('Access-Control-Allow-Origin', '*');
  respuesta.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  respuesta.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  respuesta.setHeader('Content-Type', 'application/json');
  respuesta.setHeader('Cache-Control', 'no-store');
  if (peticion.method === 'OPTIONS') { respuesta.writeHead(204); respuesta.end(); return; }
  const url = new URL(peticion.url, 'http://127.0.0.1:8002');
  const enviar = (estado, datos) => { if (!respuesta.destroyed) { respuesta.writeHead(estado); respuesta.end(JSON.stringify(datos)); } };
  if (peticion.method !== 'GET') { enviar(405, {}); return; }
  if (url.pathname === '/api/v1/rutas') {
    const busqueda = url.searchParams.get('search') ?? '';
    if (busqueda === 'red') { respuesta.destroy(); return; }
    if (busqueda === 'lenta') await new Promise(resolve => setTimeout(resolve, 4000));
    if (busqueda === 'error500') { enviar(500, { message: 'Error privado que no debe mostrarse' }); return; }
    if (busqueda === 'incompleta') { enviar(200, { success: true, data: [] }); return; }
    if (busqueda === 'html') { enviar(200, paginar([{ ...rutas[5], nombre_ruta: '<b>Ruta de prueba</b>' }], url)); return; }
    const datos = !busqueda || busqueda === 'lenta' ? rutas : rutas.filter(ruta => ruta.nombre_ruta.toLowerCase().includes(busqueda.toLowerCase()));
    enviar(200, paginar(datos, url)); return;
  }
  if (url.pathname === '/api/v1/micros/activos') {
    const rutaId = Number(url.searchParams.get('ruta_id'));
    if (rutaId === 5) { enviar(500, { success: false }); return; }
    enviar(200, paginar(unidades(rutaId), url)); return;
  }
  const ruta = url.pathname.match(/^\/api\/v1\/rutas\/(\d+)$/);
  if (ruta) {
    const id = Number(ruta[1]);
    if (id === 3 || !rutas[id - 1]) { enviar(404, {}); return; }
    enviar(200, { success: true, data: rutas[id - 1] }); return;
  }
  const micro = url.pathname.match(/^\/api\/v1\/micros\/(\d+)$/);
  if (micro) {
    const id = Number(micro[1]); const rutaId = Math.floor(id / 100);
    const datos = unidades(rutaId).find(unidad => unidad.id === id);
    if (!datos || rutaId === 4) { enviar(404, {}); return; }
    enviar(200, { success: true, data: datos }); return;
  }
  enviar(404, {});
});
servidor.listen(8002, '127.0.0.1', () => console.log('API FICTICIA T057: http://127.0.0.1:8002/api/v1. Ctrl+C para detener.'));
