/** Entrada exclusiva de QA local. Vite no la incluye en el build de producción.
 * No se importa desde la aplicación ni se usa como respaldo de una API caída. */
import { StrictMode, useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Inicio } from '../src/modulos/inicio/Inicio';
import InicioSesion from '../src/modulos/autenticacion/InicioSesion';
import { createRoot } from 'react-dom/client';
import { ConsultaPublica } from '../src/modulos/consulta-publica/ConsultaPublica';
import { AuthContext } from '../src/context/auth-context';
import { apiPublica } from '../src/services/api';
import VisorMapaPublico from '../src/modulos/consulta-publica/VisorMapaPublico';
import { adaptarRuta } from '../src/modulos/consulta-publica/contrato-publico';
import type { MicroPublico } from '../src/modulos/consulta-publica/contrato-publico';
import { Map as MapaLibre } from 'maplibre-gl';
import '../src/index.css';

const modo = new URLSearchParams(location.search).get('modo');
const local = import.meta.env.DEV && ['localhost', '127.0.0.1'].includes(location.hostname);
if (!local) throw new Error('Esta escena solo está disponible en desarrollo local.');
const emitirOriginal = MapaLibre.prototype.fire;
Object.defineProperty(MapaLibre.prototype, 'fire', { configurable: true, writable: true, value(this: MapaLibre, evento: unknown, ...argumentos: unknown[]) {
  if (evento && typeof evento === 'object' && 'type' in evento && evento.type === 'error' && 'error' in evento) {
    document.documentElement.dataset.errorMapa = evento.error instanceof Error ? evento.error.message : String(evento.error);
  }
  return Reflect.apply(emitirOriginal, this, [evento, ...argumentos]);
} });
const fondo = document.createElement('canvas');
fondo.width = fondo.height = 256;
const pincel = fondo.getContext('2d')!;
pincel.fillStyle = '#edf2f7'; pincel.fillRect(0, 0, 256, 256);
const tesela = fondo.toDataURL('image/png');
const esTesela = (url: string) => url.startsWith('https://tile.openstreetmap.org/');
let fallarTeselas = modo === 'teselas';
window.addEventListener('qa-restaurar-teselas', () => { fallarTeselas = false; });
const fetchOriginal = window.fetch.bind(window);
window.fetch = (recurso, opciones) => {
  const url = typeof recurso === 'string' ? recurso : recurso instanceof URL ? recurso.href : recurso.url;
  if (!esTesela(url)) return fetchOriginal(recurso, opciones);
  return fallarTeselas ? Promise.reject(new TypeError('Fallo ficticio de tesela')) : fetchOriginal(tesela);
};
// Algunas plataformas descargan raster con Image en lugar de fetch.
const srcOriginal = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')!;
Object.defineProperty(HTMLImageElement.prototype, 'src', {
  ...srcOriginal, set(this: HTMLImageElement, url: string) {
    srcOriginal.set!.call(this, esTesela(url) ? fallarTeselas ? 'data:image/png;base64,INVALIDA' : tesela : url);
  },
});
if (modo === 'sin-webgl') {
  const getContextOriginal = HTMLCanvasElement.prototype.getContext;
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', { value(this: HTMLCanvasElement, tipo: string, ...opciones: unknown[]) {
    return tipo.includes('webgl') ? null : Reflect.apply(getContextOriginal, this, [tipo, ...opciones]);
  } });
  window.addEventListener('qa-restaurar-webgl', () => { HTMLCanvasElement.prototype.getContext = getContextOriginal; });
}
const rutas = Array.from({ length: 9 }, (_, i) => ({ id: i + 1, activo: true,
  nombre_ruta: i === 8 ? 'Ruta con nombre largo '.repeat(12) : `Ruta ficticia ${i + 1}`,
  empresa: { razon_social: 'Empresa de pruebas T058', activo: true },
  trazado_ruta: i === 1 ? null : i === 5 ? { type: 'Point', coordinates: [NaN, 91] } : {
    type: 'LineString', coordinates: [[-70.26, -18.02], [-70.251, -18.0146], [-70.24, -18.005]],
  },
}));
function micros(rutaId: number) {
  return rutaId === 2 ? [] : Array.from({ length: rutaId === 1 ? 7 : 1 }, (_, i) => ({
    id: rutaId * 100 + i + 1, ruta_id: rutaId, placa: `FICTICIO-${rutaId}-${i + 1}`,
    estado: i % 2 ? 'en_recorrido' : 'disponible', capacidad_pasajeros: 24,
    empresa: rutas[0].empresa, ruta: { id: rutaId, activo: true },
  }));
}
const consultas: { search: string; page: number; abortada: boolean }[] = [];
const catalogo = new URLSearchParams(location.search).get('catalogo');
let fallarCatalogo = catalogo === 'error';
window.addEventListener('qa-restaurar-api', () => { fallarCatalogo = false; });
apiPublica.defaults.adapter = async config => {
  const consulta = config.url === '/rutas' ? { search: String(config.params?.search ?? ''), page: Number(config.params?.page ?? 1), abortada: false } : null;
  if (consulta) consultas.push(consulta);
  document.documentElement.dataset.consultas = JSON.stringify(consultas);
  const signal = config.signal;
  const params = config.params ?? {};
  const busqueda = String(params.search ?? '');
  await new Promise(resolve => window.setTimeout(resolve, busqueda === 'lenta' ? 1600 : 40));
  if (signal?.aborted) {
    if (consulta) consulta.abortada = true;
    document.documentElement.dataset.consultas = JSON.stringify(consultas);
    throw new Error('Solicitud ficticia cancelada');
  }
  if (busqueda === 'red') throw new TypeError('Conexión ficticia interrumpida');
  const error = (status: number): never => { throw { isAxiosError: true, response: { status }, message: 'Error ficticio controlado' }; };
  if (busqueda === 'error500' || fallarCatalogo && config.url === '/rutas') error(500);
  const paginar = (data: unknown[]) => {
    const pagina = Number(params.page ?? 1), tamano = Number(params.per_page ?? 8);
    return { success: true, data: data.slice((pagina - 1) * tamano, pagina * tamano), meta: { current_page: pagina, last_page: Math.max(1, Math.ceil(data.length / tamano)), total: data.length } };
  };
  let data: unknown;
  if (config.url === '/rutas') data = busqueda === 'incompleta' ? {} : catalogo === 'vacio' ? paginar([]) : paginar(busqueda === 'html' ? [{ ...rutas[0], nombre_ruta: '<b>Texto ficticio</b>' }] : rutas.filter(r => busqueda === 'lenta' || r.nombre_ruta.toLowerCase().includes(busqueda.toLowerCase())));
  else if (config.url === '/micros/activos') data = Number(params.ruta_id) === 5 ? error(500) : paginar(micros(Number(params.ruta_id)));
  else if (config.url?.startsWith('/rutas/')) {
    const id = Number(config.url.split('/').pop());
    data = id === 3 || !rutas[id - 1] ? error(404) : { success: true, data: rutas[id - 1] };
  } else {
    const id = Number(config.url?.split('/').pop()), rutaId = Math.floor(id / 100);
    data = rutaId === 4 ? error(404) : { success: true, data: micros(rutaId).find(m => m.id === id) };
  }
  return { data, config, headers: {}, status: 200, statusText: 'OK' };
};
const microsMapa: MicroPublico[] = [101, 102].map((id, i) => ({ id, rutaId: 1, placa: `MARCADOR-FICTICIO-${id}`, estado: 'en_recorrido', empresa: 'Empresa ficticia', capacidad: 24,
  posicion: { longitud: -70.251 + i * .004, latitud: -18.0146 + i * .003, fecha: '2026-11-26T15:00:00Z' } }));
export function EscenaMarcadores() {
  const [seleccionado, establecerSeleccionado] = useState<number | null>(null);
  return <div className="consulta-publica cp-panel"><h1>Marcadores ficticios · T058</h1><VisorMapaPublico ruta={adaptarRuta(rutas[0])} micros={microsMapa} seleccionado={seleccionado} alSeleccionar={establecerSeleccionado} />
    {microsMapa.map(m => <button className="cp-boton" key={m.id} aria-pressed={seleccionado === m.id} onClick={() => establecerSeleccionado(m.id)}>{m.placa}</button>)}
    <p role="status">Detalle ficticio seleccionado: {seleccionado ?? 'ninguno'}</p></div>;
}
let cuentas = 0;
const accesoNoDisponible = async (): Promise<never> => {
  document.documentElement.dataset.cuentas = String(++cuentas);
  await new Promise(resolve => setTimeout(resolve, 120));
  throw new Error('La escena de QA no realiza operaciones de cuenta.');
};
// Una sesión guardada en el navegador nunca dispara /auth/me desde esta escena.
const invitado = { user: null, token: null, isAuthenticated: false, isLoading: false,
  sessionError: null, sessionNotice: null, login: accesoNoDisponible, register: accesoNoDisponible,
  logout: async () => false, retrySession: () => {} };
const pantalla = new URLSearchParams(location.search).get('pantalla');
createRoot(document.getElementById('root')!).render(<StrictMode>{modo === 'marcadores' ? <EscenaMarcadores /> : <AuthContext.Provider value={invitado}>{pantalla === 'inicio' ? <Inicio /> : pantalla === 'registro' || pantalla === 'login' ? <MemoryRouter><InicioSesion registro={pantalla === 'registro'} /></MemoryRouter> : <ConsultaPublica />}</AuthContext.Provider>}</StrictMode>);
