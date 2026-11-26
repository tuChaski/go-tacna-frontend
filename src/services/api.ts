import axios from 'axios';
import { adaptarRenovacion } from './adaptador-autenticacion.ts';
import { ErrorSesion, instalarSesionHttp } from './sesion-http.ts';

const configuracion = {
  baseURL: import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8001/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
};
const api = axios.create(configuracion);
// La consulta pública comparte URL y tiempos de espera, pero nunca adjunta el
// JWT del administrador ni dispara renovaciones de una sesión ajena a la consulta.
export const apiPublica = axios.create(configuracion);
// Sin interceptores de sesión: evita que refresh/logout provoquen otra renovación.
const autenticacion = axios.create(configuracion);

export const sesionHttp = instalarSesionHttp(api, {
  leerToken: () => localStorage.getItem('token'),
  escribirToken: token => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  avisarToken: () => window.dispatchEvent(new Event('sesion-renovada')),
  avisarSalida: motivo => window.dispatchEvent(new CustomEvent('sesion-invalidada', { detail: motivo })),
  renovar: async (token, signal) => {
    const respuesta = await autenticacion.post<unknown>('/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${token}` }, signal,
    });
    try { return adaptarRenovacion(respuesta.data); }
    catch { throw new ErrorSesion('No se pudo validar la renovación. Inicia sesión nuevamente.'); }
  },
  coordinar: trabajo => typeof navigator !== 'undefined' && navigator.locks
    ? navigator.locks.request('go-tacna-renovar-sesion', trabajo) : trabajo(),
});

export async function cerrarSesionRemota(): Promise<void> {
  const token = sesionHttp.cerrarLocalmente();
  if (token) await autenticacion.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
}

if (typeof window !== 'undefined') {
  const sincronizar = (evento: StorageEvent) => {
    if (evento.key === 'token' || evento.key === null) sesionHttp.sincronizar();
  };
  window.addEventListener('storage', sincronizar);
  if (import.meta.hot) import.meta.hot.dispose(() => {
    window.removeEventListener('storage', sincronizar);
    sesionHttp.desmontar();
  });
}
export default api;
