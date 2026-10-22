/**
 * Pantalla común de acceso de administradores, basada en T053 y preparada para T056.
 * Conserva los campos solo mientras está montada; no envía ni guarda contraseñas.
 * El rol y la empresa se resolverán desde la sesión del servidor al integrar la API.
 */
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Building2, BusFront, Eye, EyeOff, Route, ShieldCheck, Users } from 'lucide-react';
import { validarAcceso } from './formulario-acceso';
import type { DatosAcceso, ErroresAcceso } from './formulario-acceso';
import '@fontsource-variable/inter';
import './acceso.css';

export default function InicioSesion() {
  const [datos, establecerDatos] = useState<DatosAcceso>({ correo: '', contrasena: '' });
  const [errores, establecerErrores] = useState<ErroresAcceso>({});
  const [visible, establecerVisible] = useState(false);
  const [pendiente, establecerPendiente] = useState(false);
  const formulario = useRef<HTMLFormElement>(null);

  // Se revalida al corregir un campo que ya mostró error. El aviso anterior deja
  // de ser vigente cuando los datos cambian, por eso se retira en la misma acción.
  function cambiar(clave: keyof DatosAcceso, valor: string) {
    const siguientes = { ...datos, [clave]: valor };
    establecerDatos(siguientes);
    establecerPendiente(false);
    if (errores[clave]) establecerErrores(actuales => ({ ...actuales, [clave]: validarAcceso(siguientes)[clave] }));
  }

  // Al abandonar el control se informa su error, sin mover el foco a otro campo.
  function revisar(clave: keyof DatosAcceso) {
    establecerErrores(actuales => ({ ...actuales, [clave]: validarAcceso(datos)[clave] }));
  }

  function ingresar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const siguientes = validarAcceso(datos);
    establecerErrores(siguientes);
    establecerPendiente(false);
    const primerError = (['correo', 'contrasena'] as const).find(clave => siguientes[clave]);
    if (primerError) {
      formulario.current?.querySelector<HTMLInputElement>(`#acceso-${primerError}`)?.focus();
      return;
    }
    // No se interpreta «campos completos» como acceso concedido. Aquí se conectará
    // la API una vez confirmados el contrato y la distinción de roles administrativos.
    establecerPendiente(true);
  }

  return (
    <main className="acceso">
      {/* Presentación adaptable: las capacidades son del producto, no datos operativos. */}
      <section className="acceso-presentacion" aria-labelledby="acceso-presentacion-titulo">
        <a className="acceso-marca" href="/" aria-label="Go Tacna, volver al inicio">
          <span className="acceso-marca-icono"><BusFront size={26} aria-hidden="true" /></span>Go Tacna
        </a>
        <div className="acceso-propuesta">
          <span className="acceso-etiqueta">Administración web</span>
          <h2 id="acceso-presentacion-titulo">Tu flota,<br /> en un solo lugar.</h2>
          <p>Gestiona rutas, micros y conductores desde un espacio organizado para tu empresa.</p>
          <div className="acceso-capacidades" aria-label="Módulos administrativos">
            <span><Route size={21} aria-hidden="true" />Rutas</span>
            <span><BusFront size={21} aria-hidden="true" />Micros</span>
            <span><Users size={21} aria-hidden="true" />Conductores</span>
          </div>
        </div>
        <p className="acceso-privacidad"><ShieldCheck size={22} aria-hidden="true" />Cada empresa trabaja con su propia información.</p>
      </section>

      <section className="acceso-contenido" aria-labelledby="acceso-titulo">
        <a className="acceso-volver" href="/"><ArrowLeft size={17} aria-hidden="true" />Volver al inicio</a>
        <div className="acceso-tarjeta">
          <span className="acceso-simbolo"><Building2 size={25} aria-hidden="true" /></span>
          <header>
            <p className="acceso-sobretitulo">Acceso administrativo</p>
            <h1 id="acceso-titulo">Iniciar sesión</h1>
            <p>Ingresa con las credenciales que te entregaron.</p>
          </header>

          {/* Validación propia con noValidate para mostrar mensajes consistentes y
              asociarlos al campo mediante aria-describedby, tanto con ratón como teclado. */}
          <form ref={formulario} onSubmit={ingresar} noValidate>
            <div className="acceso-campo">
              <label htmlFor="acceso-correo">Correo electrónico</label>
              <input id="acceso-correo" name="email" type="email" autoComplete="username" required
                autoCapitalize="none" spellCheck={false} placeholder="nombre@empresa.pe" value={datos.correo}
                aria-invalid={Boolean(errores.correo)} aria-describedby="acceso-correo-ayuda"
                onChange={evento => cambiar('correo', evento.target.value)} onBlur={() => revisar('correo')} />
              <p id="acceso-correo-ayuda" className={errores.correo ? 'acceso-error' : 'acceso-ayuda'}>
                {errores.correo || 'Utiliza el correo de tu cuenta administrativa.'}
              </p>
            </div>
            <div className="acceso-campo">
              <label htmlFor="acceso-contrasena">Contraseña</label>
              <div className="acceso-clave">
                <input id="acceso-contrasena" name="password" type={visible ? 'text' : 'password'}
                  autoComplete="current-password" required value={datos.contrasena} placeholder="Ingresa tu contraseña"
                  aria-invalid={Boolean(errores.contrasena)} aria-describedby="acceso-contrasena-ayuda"
                  onChange={evento => cambiar('contrasena', evento.target.value)} onBlur={() => revisar('contrasena')} />
                <button className="acceso-mostrar" type="button" aria-controls="acceso-contrasena"
                  aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={visible}
                  onClick={() => establecerVisible(actual => !actual)}>
                  {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                </button>
              </div>
              <p id="acceso-contrasena-ayuda" className={errores.contrasena ? 'acceso-error' : 'acceso-ayuda'}>
                {errores.contrasena || (visible ? 'La contraseña está visible.' : 'Tu contraseña permanece oculta.')}
              </p>
            </div>
            <button type="submit" className="acceso-ingresar">Iniciar sesión<ArrowRight size={19} aria-hidden="true" /></button>
            {/* Aviso explícito de esta etapa; no se crea sesión ni se abre un panel ficticio. */}
            {pendiente && <p className="acceso-aviso" role="status">Los campos están completos. La conexión de inicio de sesión está pendiente; no se enviaron credenciales ni se inició una sesión.</p>}
          </form>
          <p className="acceso-soporte">¿Necesitas acceso? Contacta a quien administra tu cuenta.</p>
        </div>
        <p className="acceso-pie">Go Tacna · Gestión del transporte</p>
      </section>
    </main>
  );
}
