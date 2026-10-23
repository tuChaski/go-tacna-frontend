/** Sesión validada por /auth/me. Los datos almacenados no conceden acceso por sí solos. */
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import type { AuthResponse, LoginCredentials, User } from '../types/auth';
import type { DatosRegistro } from '../services/adaptador-autenticacion';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const operacion = useRef(0);

  useEffect(() => {
    const controlador = new AbortController();
    const version = ++operacion.current;
    const vigente = () => !controlador.signal.aborted && version === operacion.current;
    const limpiar = () => {
      ++operacion.current;
      setUser(null); setToken(null); setSessionError(null); setIsLoading(false);
    };
    const sincronizar = (evento: StorageEvent) => {
      if (evento.key !== 'token' && evento.key !== null) return;
      ++operacion.current;
      setUser(null); setToken(null); setSessionError(null); setIsLoading(true);
      setRevision(actual => actual + 1);
    };
    window.addEventListener('sesion-invalidada', limpiar);
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
        if (vigente()) { setUser(perfil); setToken(almacenado); }
      } catch {
        if (vigente() && localStorage.getItem('token')) {
          setSessionError('No se pudo comprobar tu sesión. Revisa la conexión y vuelve a intentarlo.');
        }
      } finally {
        if (vigente()) setIsLoading(false);
      }
    }
    void restaurar();
    return () => { controlador.abort(); window.removeEventListener('sesion-invalidada', limpiar); window.removeEventListener('storage', sincronizar); };
  }, [revision]);

  // Evita que una respuesta vieja restaure una sesión que ya fue reemplazada.
  async function autenticar(solicitud: () => Promise<AuthResponse>) {
    const version = ++operacion.current;
    const datos = await solicitud();
    if (version !== operacion.current) throw new Error('La operación de acceso ya no está vigente.');
    localStorage.setItem('token', datos.token);
    localStorage.removeItem('user');
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
    isLoading, login, register, logout, sessionError, retrySession }}>{children}</AuthContext.Provider>;
}
