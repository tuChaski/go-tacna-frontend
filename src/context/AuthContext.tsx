/** Sesión validada por /auth/me. Los datos almacenados no conceden acceso por sí solos. */
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import type { AuthResponse, LoginCredentials, User } from '../types/auth';
import type { DatosRegistro } from '../services/adaptador-autenticacion';
import { AuthContext } from './auth-context';
import { sesionHttp } from '../services/api';
import { demoraRenovacion } from '../services/sesion-http';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const operacion = useRef(0);

  useEffect(() => {
    const controlador = new AbortController();
    const version = ++operacion.current;
    const vigente = () => !controlador.signal.aborted && version === operacion.current;
    const limpiar = (evento: Event) => {
      ++operacion.current;
      const motivo: unknown = (evento as CustomEvent).detail;
      setSessionNotice(typeof motivo === 'string' ? motivo : null);
      setUser(null); setToken(null); setSessionError(null); setIsLoading(false);
    };
    const renovada = () => setToken(sesionHttp.leerToken());
    const sincronizar = (evento: StorageEvent) => {
      if (evento.key !== 'token' && evento.key !== null) return;
      ++operacion.current;
      setUser(null); setToken(null); setSessionError(null); setIsLoading(true);
      setRevision(actual => actual + 1);
    };
    window.addEventListener('sesion-invalidada', limpiar);
    window.addEventListener('sesion-renovada', renovada);
    window.addEventListener('storage', sincronizar);
    async function restaurar() {
      const almacenado = localStorage.getItem('token');
      // Retira la caché heredada: identidad y empresas siempre se consultan a la API.
      localStorage.removeItem('user');
      if (!almacenado) {
        if (vigente()) setIsLoading(false);
        return;
      }
      try {
        const perfil = await authService.getProfile(controlador.signal);
        if (vigente()) { setUser(perfil); setToken(sesionHttp.leerToken()); }
      } catch {
        if (vigente() && localStorage.getItem('token')) {
          setSessionError('No se pudo comprobar tu sesión. Revisa la conexión y vuelve a intentarlo.');
        }
      } finally {
        if (vigente()) setIsLoading(false);
      }
    }
    void restaurar();
    return () => { controlador.abort(); window.removeEventListener('sesion-invalidada', limpiar); window.removeEventListener('sesion-renovada', renovada); window.removeEventListener('storage', sincronizar); };
  }, [revision]);

  // Mantiene el formulario montado mientras renueva; al volver de suspensión
  // comprueba otra vez el vencimiento. No intenta recuperar JWT ya vencidos.
  useEffect(() => {
    if (!user || !token) return;
    let activo = true;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const programar = (reintento = false) => {
      if (!activo || sesionHttp.leerToken() !== token) return;
      clearTimeout(temporizador);
      const demora = demoraRenovacion(token);
      if (demora !== null) temporizador = setTimeout(() => void comprobar(), reintento ? 15_000 : Math.min(demora, 2_147_483_647));
    };
    const comprobar = async () => {
      try { await sesionHttp.renovarSiCorresponde(); programar(); }
      catch { programar(true); }
    };
    const visible = () => { if (document.visibilityState === 'visible') void comprobar(); };
    programar();
    window.addEventListener('focus', visible);
    window.addEventListener('online', visible);
    document.addEventListener('visibilitychange', visible);
    return () => {
      activo = false; clearTimeout(temporizador);
      window.removeEventListener('focus', visible); window.removeEventListener('online', visible);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [token, user]);

  // Evita que una respuesta vieja restaure una sesión que ya fue reemplazada.
  async function autenticar(solicitud: () => Promise<AuthResponse>) {
    const version = ++operacion.current;
    const datos = await solicitud();
    if (version !== operacion.current) throw new Error('La operación de acceso ya no está vigente.');
    sesionHttp.guardarSesion(datos.token);
    setSessionNotice(null);
    setUser(datos.user); setToken(datos.token); setSessionError(null); setIsLoading(false);
    return datos.user;
  }
  const login = (datos: LoginCredentials) => autenticar(() => authService.login(datos));
  const register = (datos: DatosRegistro) => autenticar(() => authService.register(datos));

  async function logout() {
    const version = ++operacion.current;
    let invalidado = true;
    try { await authService.logout(); } catch { invalidado = false; }
    finally {
      if (version === operacion.current) {
        localStorage.removeItem('token'); localStorage.removeItem('user');
        setUser(null); setToken(null); setSessionError(null); setIsLoading(false);
      }
    }
    return invalidado;
  }

  function retrySession() {
    setUser(null); setToken(null); setSessionError(null); setIsLoading(true);
    setRevision(actual => actual + 1);
  }
  return <AuthContext.Provider value={{ user, token, isAuthenticated: Boolean(user && token),
    isLoading, login, register, logout, sessionError, sessionNotice, retrySession }}>{children}</AuthContext.Provider>;
}
