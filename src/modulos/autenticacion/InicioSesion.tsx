/**
 * Pantalla común de acceso y registro de pasajeros, basada en T053 y preparada para T056.
 * Conserva los campos solo en memoria; los envía al servicio sin persistir contraseñas.
 * El destino se obtiene del usuario devuelto por el servidor, nunca de un selector.
 */
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { IconoPublico } from '../publico/IconoPublico';
import { validarAcceso, validarAlta } from './formulario-acceso';
import type { DatosAlta, ErroresAlta } from './formulario-acceso';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { explicarErrorAcceso } from './errores-acceso';
import { destinoSesion } from './destino-sesion';
import '@fontsource-variable/inter';
import './acceso.css';

/** Atributos de los datos personales del alta; los límites siguen las reglas de validarAlta. */
const camposAlta = {
  dni: { etiqueta: 'Documento de identidad (DNI)', ejemplo: '12345678', ayuda: '8 dígitos numéricos.', limite: 8, autocompletado: 'off', modoEntrada: 'numeric' },
  nombre: { etiqueta: 'Nombres', ejemplo: 'Ingresa tus nombres', ayuda: '', limite: 120, autocompletado: 'given-name', modoEntrada: 'text' },
  apellido: { etiqueta: 'Apellidos', ejemplo: 'Ingresa tus apellidos', ayuda: '', limite: 120, autocompletado: 'family-name', modoEntrada: 'text' },
  telefono: { etiqueta: 'Teléfono', ejemplo: '912345678', ayuda: '9 dígitos, empieza con 9.', limite: 9, autocompletado: 'tel', modoEntrada: 'tel' },
} as const;

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
    const orden: (keyof DatosAlta)[] = registro ? ['nombre', 'apellido', 'dni', 'telefono', 'correo', 'contrasena', 'confirmacion'] : ['correo', 'contrasena'];
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
    <main className={`acceso ${registro ? 'acceso-registro' : 'acceso-login'}`}>
      {/* Presentación adaptable: las capacidades son del producto, no datos operativos. */}
      <section className="acceso-presentacion" aria-labelledby="acceso-presentacion-titulo">
        <a className="acceso-marca" href="/" aria-label="Go Tacna, volver al inicio">
          <span className="acceso-marca-icono"><IconoPublico nombre="bus" tamano={24} /></span>Go Tacna
        </a>
        <div className="acceso-propuesta">
          <span className="acceso-etiqueta">{registro ? 'Cuenta de pasajero' : 'Acceso web'}</span>
          <h2 id="acceso-presentacion-titulo">{registro ? 'Tu viaje empieza aquí.' : <>Tu ciudad,<br /> más cerca.</>}</h2>
          <p>{registro ? 'Crea tu cuenta para acceder a los servicios de Go Tacna.' : 'Accede a tu cuenta de pasajero, empresa o administración con tus credenciales.'}</p>
          {!registro && <div className="acceso-capacidades" aria-label="Módulos administrativos">
            <span><IconoPublico nombre="ruta" tamano={20} />Rutas</span>
            <span><IconoPublico nombre="bus" tamano={20} />Micros</span>
            <span><IconoPublico nombre="personas" tamano={20} />Conductores</span>
          </div>}
        </div>
        <p className="acceso-privacidad"><IconoPublico nombre="privacidad" tamano={20} />{registro ? 'Usa tus credenciales para acceder a tu cuenta.' : 'Acceso según el rol de tu cuenta.'}</p>
      </section>

      <section className="acceso-contenido" aria-labelledby="acceso-titulo">
        <a className="acceso-volver" href="/"><IconoPublico nombre="anterior" tamano={16} />Volver al inicio</a>
        <div className="acceso-tarjeta">
          <span className="acceso-simbolo"><IconoPublico nombre="pasajero" tamano={24} /></span>
          <header>
            <p className="acceso-sobretitulo">{registro ? 'Registro de pasajeros' : 'Acceso a Go Tacna'}</p>
            <h1 id="acceso-titulo">{registro ? 'Crear cuenta' : 'Iniciar sesión'}</h1>
            <p>{registro ? 'Completa tus datos para crear tu cuenta de pasajero. Todos los campos son obligatorios.' : 'Ingresa con el correo y la contraseña de tu cuenta.'}</p>
          </header>

          {/* Validación propia con noValidate para mostrar mensajes consistentes y
              asociarlos al campo mediante aria-describedby, tanto con ratón como teclado. */}
          {typeof ubicacion.state?.aviso === 'string' && <p className="acceso-aviso" role="status">{ubicacion.state.aviso}</p>}
          <form ref={formulario} onSubmit={ingresar} noValidate aria-busy={enviando}>
            {registro && (['nombre', 'apellido', 'dni', 'telefono'] as const).map(clave => (
              <div className="acceso-campo" key={clave}>
                <label htmlFor={`acceso-${clave}`}>{camposAlta[clave].etiqueta}</label>
                <input id={`acceso-${clave}`} name={clave} placeholder={camposAlta[clave].ejemplo} required disabled={enviando} value={datos[clave]}
                  autoComplete={camposAlta[clave].autocompletado} inputMode={camposAlta[clave].modoEntrada}
                  type={clave === 'telefono' ? 'tel' : 'text'} maxLength={camposAlta[clave].limite}
                  aria-invalid={Boolean(errores[clave])} aria-describedby={`acceso-${clave}-ayuda`}
                  onBlur={() => revisar(clave)} onChange={evento => cambiar(clave, evento.target.value)} />
                <p id={`acceso-${clave}-ayuda`} className={errores[clave] ? 'acceso-error' : 'acceso-ayuda'} role={errores[clave] ? 'alert' : undefined}>{errores[clave] || camposAlta[clave].ayuda}</p>
              </div>
            ))}
            <div className="acceso-campo acceso-campo-completo">
              <label htmlFor="acceso-correo">Correo electrónico</label>
              <input id="acceso-correo" name="email" type="email" autoComplete={registro ? 'email' : 'username'} required disabled={enviando}
                autoCapitalize="none" spellCheck={false} placeholder="nombre@correo.pe" value={datos.correo}
                aria-invalid={Boolean(errores.correo)} aria-describedby="acceso-correo-ayuda"
                onChange={evento => cambiar('correo', evento.target.value)} onBlur={() => revisar('correo')} />
              <p id="acceso-correo-ayuda" className={errores.correo ? 'acceso-error' : 'acceso-ayuda'} role={errores.correo ? 'alert' : undefined}>
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
                  {visible ? <IconoPublico nombre="visible" tamano={20} /> : <IconoPublico nombre="visible" tamano={20} />}
                </button>
              </div>
              <p id="acceso-contrasena-ayuda" className={errores.contrasena ? 'acceso-error' : 'acceso-ayuda'} role={errores.contrasena ? 'alert' : undefined}>
                {errores.contrasena || (registro ? 'Al menos 8 caracteres.' : visible ? 'La contraseña está visible.' : 'Tu contraseña permanece oculta.')}
              </p>
            </div>
            {registro && <div className="acceso-campo"><label htmlFor="acceso-confirmacion">Confirmar contraseña</label>
              <input id="acceso-confirmacion" name="confirmacion" type={visible ? 'text' : 'password'} autoComplete="new-password" required disabled={enviando}
                placeholder="Repite tu contraseña" value={datos.confirmacion} aria-invalid={Boolean(errores.confirmacion)} aria-describedby="acceso-confirmacion-ayuda"
                onChange={evento => cambiar('confirmacion', evento.target.value)} onBlur={() => revisar('confirmacion')} />
              <p id="acceso-confirmacion-ayuda" className={errores.confirmacion ? 'acceso-error' : 'acceso-ayuda'} role={errores.confirmacion ? 'alert' : undefined}>{errores.confirmacion || 'Repite tu contraseña.'}</p></div>}
            <button type="submit" className="acceso-ingresar" disabled={enviando}>{enviando ? 'Enviando…' : registro ? 'Crear cuenta' : 'Iniciar sesión'}<IconoPublico nombre="avanzar" tamano={20} /></button>
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
