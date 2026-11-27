/**
 * Pantalla común de acceso de administradores, basada en T053 y preparada para T056.
 * Conserva los campos solo en memoria; los envía al servicio sin persistir contraseñas.
 * El destino se obtiene del usuario devuelto por el servidor, nunca de un selector.
 */
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Building2, BusFront, Eye, EyeOff, Route, ShieldCheck, Users } from 'lucide-react';
import { validarAcceso, validarAlta } from './formulario-acceso';
import type { DatosAlta, ErroresAlta } from './formulario-acceso';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { explicarErrorAcceso } from './errores-acceso';
import { destinoSesion } from './destino-sesion';
import '@fontsource-variable/inter';
import './acceso.css';

export default function InicioSesion({ registro = false }: { registro?: boolean }) {
  const [datos, establecerDatos] = useState<DatosAlta>({ correo: '', contrasena: '', dni: '', nombre: '', apellido: '', telefono: '', confirmacion: '' });
  const [errores, establecerErrores] = useState<ErroresAlta>({});
  const [visible, establecerVisible] = useState(false);
  const [enviando, establecerEnviando] = useState(false);
  const [mensaje, establecerMensaje] = useState('');
  const bloqueo = useRef(false);
  const enfoquePendiente = useRef<keyof DatosAlta | null>(null);
  const { login, register, user, isLoading, sessionError, retrySession, logout } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const formulario = useRef<HTMLFormElement>(null);

  // Los controles están deshabilitados durante la petición. Un error remoto
  // recibe foco después de habilitarlos, no mientras siguen bloqueados.
  useEffect(() => {
    if (!enviando && enfoquePendiente.current) {
      formulario.current?.querySelector<HTMLInputElement>(`#acceso-${enfoquePendiente.current}`)?.focus();
      enfoquePendiente.current = null;
    }
  }, [enviando]);

  // Se revalida al corregir un campo que ya mostró error. El aviso anterior deja
  // de ser vigente cuando los datos cambian, por eso se retira en la misma acción.
  const validar = registro ? validarAlta : validarAcceso;
  function cambiar(clave: keyof DatosAlta, valor: string) {
    const siguientes = { ...datos, [clave]: valor };
    establecerDatos(siguientes);
    establecerMensaje('');
    if (errores[clave] || clave === 'contrasena' && errores.confirmacion) {
      establecerErrores(actuales => ({ ...actuales, [clave]: (validar(siguientes) as ErroresAlta)[clave],
        ...(clave === 'contrasena' && errores.confirmacion ? { confirmacion: validarAlta(siguientes).confirmacion } : {}) }));
    }
  }

  // Al abandonar el control se informa su error, sin mover el foco a otro campo.
  function revisar(clave: keyof DatosAlta) {
    establecerErrores(actuales => ({ ...actuales, [clave]: (validar(datos) as ErroresAlta)[clave] }));
  }

  function enfocarError(siguientes: ErroresAlta) {
    const orden: (keyof DatosAlta)[] = registro ? ['dni', 'nombre', 'apellido', 'telefono', 'correo', 'contrasena', 'confirmacion'] : ['correo', 'contrasena'];
    const primerError = orden.find(clave => siguientes[clave]);
    if (primerError) {
      if (bloqueo.current) enfoquePendiente.current = primerError;
      else formulario.current?.querySelector<HTMLInputElement>(`#acceso-${primerError}`)?.focus();
    }
    return Boolean(primerError);
  }

  async function ingresar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (bloqueo.current) return;
    const siguientes = validar(datos);
    establecerErrores(siguientes);
    establecerMensaje('');
    if (enfocarError(siguientes)) return;
    bloqueo.current = true; establecerEnviando(true);
    try {
      const perfil = registro ? await register({ dni: datos.dni, nombre: datos.nombre, apellido: datos.apellido,
        telefono: datos.telefono, email: datos.correo, contrasena: datos.contrasena })
        : await login({ email: datos.correo, contrasena: datos.contrasena });
      establecerDatos(actual => ({ ...actual, contrasena: '', confirmacion: '' }));
      navegar(destinoSesion(perfil.rol), { replace: true });
    } catch (error) {
      const detalle = explicarErrorAcceso(error);
      establecerErrores(detalle.campos); establecerMensaje(detalle.mensaje);
      enfocarError(detalle.campos);
    } finally {
      bloqueo.current = false; establecerEnviando(false);
    }
  }

  if (isLoading) return <main className="acceso-sesion"><p role="status">Comprobando sesión…</p></main>;
  if (user) return <Navigate to={destinoSesion(user.rol)} replace />;
  if (sessionError) return <main className="acceso-sesion"><p role="alert">{sessionError}</p>
    <button onClick={retrySession}>Reintentar</button><button onClick={() => void logout()}>Descartar sesión local</button></main>;

  return (
    <main className="acceso">
      {/* Presentación adaptable: las capacidades son del producto, no datos operativos. */}
      <section className="acceso-presentacion" aria-labelledby="acceso-presentacion-titulo">
        <a className="acceso-marca" href="/" aria-label="Go Tacna, volver al inicio">
          <span className="acceso-marca-icono"><BusFront size={26} aria-hidden="true" /></span>Go Tacna
        </a>
        <div className="acceso-propuesta">
          <span className="acceso-etiqueta">{registro ? 'Cuenta de pasajero' : 'Acceso web'}</span>
          <h2 id="acceso-presentacion-titulo">{registro ? 'Tu viaje empieza aquí.' : <>Tu flota,<br /> en un solo lugar.</>}</h2>
          <p>{registro ? 'Crea tu cuenta para acceder a los servicios de Go Tacna.' : 'Gestiona rutas, micros y conductores desde un espacio organizado para tu empresa.'}</p>
          {!registro && <div className="acceso-capacidades" aria-label="Módulos administrativos">
            <span><Route size={21} aria-hidden="true" />Rutas</span>
            <span><BusFront size={21} aria-hidden="true" />Micros</span>
            <span><Users size={21} aria-hidden="true" />Conductores</span>
          </div>}
        </div>
        <p className="acceso-privacidad"><ShieldCheck size={22} aria-hidden="true" />{registro ? 'Usa tus credenciales para acceder a tu cuenta.' : 'Cada empresa trabaja con su propia información.'}</p>
      </section>

      <section className="acceso-contenido" aria-labelledby="acceso-titulo">
        <a className="acceso-volver" href="/"><ArrowLeft size={17} aria-hidden="true" />Volver al inicio</a>
        <div className="acceso-tarjeta">
          <span className="acceso-simbolo"><Building2 size={25} aria-hidden="true" /></span>
          <header>
            <p className="acceso-sobretitulo">{registro ? 'Registro de pasajeros' : 'Acceso a Go Tacna'}</p>
            <h1 id="acceso-titulo">{registro ? 'Crear cuenta' : 'Iniciar sesión'}</h1>
            <p>{registro ? 'Completa tus datos. Las cuentas administrativas las crea el administrador general.' : 'Ingresa con el correo y la contraseña de tu cuenta.'}</p>
          </header>

          {/* Validación propia con noValidate para mostrar mensajes consistentes y
              asociarlos al campo mediante aria-describedby, tanto con ratón como teclado. */}
          {typeof ubicacion.state?.aviso === 'string' && <p className="acceso-aviso" role="status">{ubicacion.state.aviso}</p>}
          <form ref={formulario} onSubmit={ingresar} noValidate aria-busy={enviando}>
            {registro && (['dni', 'nombre', 'apellido', 'telefono'] as const).map(clave => (
              <div className="acceso-campo" key={clave}>
                <label htmlFor={`acceso-${clave}`}>{{ dni: 'Documento de identidad (DNI)', nombre: 'Nombres', apellido: 'Apellidos', telefono: 'Teléfono' }[clave]}</label>
                <input id={`acceso-${clave}`} required disabled={enviando} value={datos[clave]}
                  autoComplete={{ dni: 'off', nombre: 'given-name', apellido: 'family-name', telefono: 'tel' }[clave]}
                  type={clave === 'telefono' ? 'tel' : 'text'} maxLength={{ dni: 20, nombre: 120, apellido: 120, telefono: 30 }[clave]}
                  aria-invalid={Boolean(errores[clave])} aria-describedby={`acceso-${clave}-ayuda`}
                  onBlur={() => revisar(clave)} onChange={evento => cambiar(clave, evento.target.value)} />
                <p id={`acceso-${clave}-ayuda`} className={errores[clave] ? 'acceso-error' : 'acceso-ayuda'}>{errores[clave] || 'Obligatorio.'}</p>
              </div>
            ))}
            <div className="acceso-campo">
              <label htmlFor="acceso-correo">Correo electrónico</label>
              <input id="acceso-correo" name="email" type="email" autoComplete={registro ? 'email' : 'username'} required disabled={enviando}
                autoCapitalize="none" spellCheck={false} placeholder="nombre@empresa.pe" value={datos.correo}
                aria-invalid={Boolean(errores.correo)} aria-describedby="acceso-correo-ayuda"
                onChange={evento => cambiar('correo', evento.target.value)} onBlur={() => revisar('correo')} />
              <p id="acceso-correo-ayuda" className={errores.correo ? 'acceso-error' : 'acceso-ayuda'}>
                {errores.correo || 'Utiliza el correo de tu cuenta.'}
              </p>
            </div>
            <div className="acceso-campo">
              <label htmlFor="acceso-contrasena">Contraseña</label>
              <div className="acceso-clave">
                <input id="acceso-contrasena" name="password" type={visible ? 'text' : 'password'}
                  autoComplete={registro ? 'new-password' : 'current-password'} required disabled={enviando} value={datos.contrasena} placeholder="Ingresa tu contraseña"
                  aria-invalid={Boolean(errores.contrasena)} aria-describedby="acceso-contrasena-ayuda"
                  onChange={evento => cambiar('contrasena', evento.target.value)} onBlur={() => revisar('contrasena')} />
                <button className="acceso-mostrar" type="button" aria-controls="acceso-contrasena"
                  aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={visible}
                  onClick={() => establecerVisible(actual => !actual)}>
                  {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                </button>
              </div>
              <p id="acceso-contrasena-ayuda" className={errores.contrasena ? 'acceso-error' : 'acceso-ayuda'}>
                {errores.contrasena || (registro ? 'Al menos 8 caracteres.' : visible ? 'La contraseña está visible.' : 'Tu contraseña permanece oculta.')}
              </p>
            </div>
            {registro && <div className="acceso-campo"><label htmlFor="acceso-confirmacion">Confirmar contraseña</label>
              <input id="acceso-confirmacion" type={visible ? 'text' : 'password'} autoComplete="new-password" required disabled={enviando}
                value={datos.confirmacion} aria-invalid={Boolean(errores.confirmacion)} aria-describedby="acceso-confirmacion-ayuda"
                onChange={evento => cambiar('confirmacion', evento.target.value)} onBlur={() => revisar('confirmacion')} />
              <p id="acceso-confirmacion-ayuda" className={errores.confirmacion ? 'acceso-error' : 'acceso-ayuda'}>{errores.confirmacion || 'Repite tu contraseña.'}</p></div>}
            <button type="submit" className="acceso-ingresar" disabled={enviando}>{enviando ? 'Enviando…' : registro ? 'Crear cuenta' : 'Iniciar sesión'}<ArrowRight size={19} aria-hidden="true" /></button>
            {mensaje && <p className="acceso-aviso" role="alert">{mensaje}</p>}
            {enviando && <p role="status">Esperando respuesta del servidor…</p>}
          </form>
          <p className="acceso-soporte">{registro ? <Link to="/login">Ya tengo cuenta. Iniciar sesión</Link> : <><Link to="/registro">Crear cuenta de pasajero</Link><br />Para acceso administrativo, contacta a quien administra tu cuenta.</>}</p>
        </div>
        <p className="acceso-pie">Go Tacna · Gestión del transporte</p>
      </section>
    </main>
  );
}
