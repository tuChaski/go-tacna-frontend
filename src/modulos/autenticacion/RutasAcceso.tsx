/** Rutas de sesión reales; el maquetado /admin/preview sigue siendo una revisión independiente. */
import { useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AuthProvider } from '../../context/AuthContext';
import InicioSesion from './InicioSesion';
import { destinoSesion } from './destino-sesion';
import { PanelAdministracion } from '../administracion/PanelAdministracion';

function Cuenta({ destino }: { destino: '/admin' | '/admin/empresa' | '/cuenta' }) {
  const { user, isLoading, sessionError, retrySession, logout } = useAuth();
  const [saliendo, establecerSaliendo] = useState(false);
  const bloqueo = useRef(false);
  const navegar = useNavigate();
  async function salir() {
    if (bloqueo.current) return;
    bloqueo.current = true; establecerSaliendo(true);
    const invalidado = await logout();
    navegar('/login', { replace: true, state: { aviso: invalidado ? 'Sesión cerrada.' : 'Saliste de este dispositivo, pero no se pudo confirmar la invalidación del token en el servidor.' } });
  }
  if (isLoading) return <main className="acceso-sesion"><p role="status">Comprobando sesión…</p></main>;
  // Espera la navegación explícita de salir(): preserva su aviso si falló la
  // invalidación remota, en vez de competir con un Navigate sin estado.
  if (!user && saliendo) return <main className="acceso-sesion"><p role="status">Cerrando sesión…</p></main>;
  if (sessionError) return <main className="acceso-sesion"><h1>No pudimos comprobar tu sesión</h1><p role="alert">{sessionError}</p>
    <button className="acceso-ingresar" onClick={retrySession}>Reintentar</button><button disabled={saliendo} onClick={() => void salir()}>Salir de este dispositivo</button></main>;
  if (!user) return <Navigate to="/login" replace />;
  if (destinoSesion(user.rol) !== destino) return <Navigate to={destinoSesion(user.rol)} replace />;
  // Se monta únicamente tras verificar sesión y rol, conservando el cierre de T056.
  if (user.rol === 'admin_general' || user.rol === 'admin_empresa') return <PanelAdministracion usuario={user} saliendo={saliendo} alSalir={() => void salir()} />;
  const titulo = 'Mi cuenta';
  return <main className="acceso-sesion">
    <p>Go Tacna · Sesión verificada</p><h1>{titulo}</h1><h2>Hola, {user.nombre} {user.apellido}</h2><p>{user.email}</p>
    {/* No abre registros ficticios como si fueran datos de la sesión autenticada. */}
    <p>{user.rol === 'conductor' ? 'Tu cuenta de conductor está verificada. Usa la aplicación móvil para operar el recorrido.' : 'Tu cuenta de pasajero está verificada.'}</p>
    <button className="acceso-ingresar" disabled={saliendo} onClick={() => void salir()}>{saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}</button>
    <a href="/">Volver al inicio</a>
  </main>;
}

export default function RutasAcceso() {
  return <AuthProvider><BrowserRouter><Routes>
    <Route path="/login" element={<InicioSesion key="login" />} />
    <Route path="/registro" element={<InicioSesion key="registro" registro />} />
    <Route path="/admin/*" element={<Cuenta destino="/admin" />} />
    <Route path="/admin/empresa/*" element={<Cuenta destino="/admin/empresa" />} />
    <Route path="/cuenta" element={<Cuenta destino="/cuenta" />} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes></BrowserRouter></AuthProvider>;
}
