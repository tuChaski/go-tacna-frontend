/**
 * Maqueta registro y edición con secciones de empresa y cuenta administrativa.
 * Mantiene una copia temporal: cancelar o salir descarta los datos y no realiza
 * peticiones. Un envío válido informa que falta la integración, nunca éxito ficticio.
 */
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldCheck } from 'lucide-react';
import { PageHeading } from '../componentes/PageHeading';
import { PendingNotice } from '../componentes/PendingNotice';
import eye from '../recursos/eye.svg';
import { camposAdministrador, camposEmpresa, validarEmpresa } from './formulario-empresa';
import type { DatosFormularioEmpresa, ErroresEmpresa } from './formulario-empresa';
import { empresaReferencia, rutaEmpresas } from './empresa-referencia';

export function FormularioEmpresa({ editando = false }: { editando?: boolean }) {
  // La contraseña nunca se precarga. El ejemplo no muta al editar esta copia.
  const [datos, establecerDatos] = useState<DatosFormularioEmpresa>(() => ({
    razonSocial: editando ? empresaReferencia.razonSocial : '',
    ruc: editando ? empresaReferencia.ruc : '',
    telefonoEmpresa: editando ? empresaReferencia.telefonoEmpresa : '',
    direccion: editando ? empresaReferencia.direccion : '',
    dni: editando ? empresaReferencia.dni : '',
    nombre: editando ? empresaReferencia.nombre : '',
    apellido: editando ? empresaReferencia.apellido : '',
    telefonoAdministrador: editando ? empresaReferencia.telefonoAdministrador : '',
    correo: editando ? empresaReferencia.correo : '',
    contrasena: '',
  }));
  const [errores, establecerErrores] = useState<ErroresEmpresa>({});
  const [mostrarContrasena, establecerMostrarContrasena] = useState(false);
  const [pendiente, establecerPendiente] = useState(false);
  const formulario = useRef<HTMLFormElement>(null);

  // Revalida al salir del campo; al escribir corrige solo errores ya mostrados.
  function cambiar(clave: keyof DatosFormularioEmpresa, valor: string) {
    const siguientes = { ...datos, [clave]: valor };
    establecerDatos(siguientes);
    establecerPendiente(false);
    if (errores[clave]) establecerErrores(actuales => ({ ...actuales, [clave]: validarEmpresa(siguientes, !editando)[clave] }));
  }
  function comprobarCampo(clave: keyof DatosFormularioEmpresa) {
    establecerErrores(actuales => ({ ...actuales, [clave]: validarEmpresa(datos, !editando)[clave] }));
  }
  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const siguientes = validarEmpresa(datos, !editando);
    establecerErrores(siguientes);
    establecerPendiente(false);
    const orden: (keyof DatosFormularioEmpresa)[] = [...camposEmpresa, ...camposAdministrador].map(campo => campo.clave);
    orden.push('contrasena');
    const primero = orden.find(clave => siguientes[clave]);
    if (primero) {
      formulario.current?.querySelector<HTMLInputElement>(`#empresa-${primero}`)?.focus();
      return;
    }
    establecerPendiente(true);
  }

  // Un único patrón de campo mantiene consistentes etiquetas, límites y ayudas.
  function mostrarCampo(campo: (typeof camposEmpresa)[number]) {
    return <div className="admin-field" key={campo.clave}>
      <label htmlFor={`empresa-${campo.clave}`}>{campo.etiqueta}</label>
      <input id={`empresa-${campo.clave}`} name={campo.clave} type={campo.tipo} required
        maxLength={campo.limite} value={datos[campo.clave]} autoComplete="off"
        aria-invalid={Boolean(errores[campo.clave])} aria-describedby={`empresa-${campo.clave}-ayuda`}
        onChange={evento => cambiar(campo.clave, evento.target.value)} onBlur={() => comprobarCampo(campo.clave)} />
      <p id={`empresa-${campo.clave}-ayuda`} className={errores[campo.clave] ? 'admin-field-error' : 'admin-field-help'}>
        {errores[campo.clave] || campo.ayuda}
      </p>
    </div>;
  }

  return <>
    <PageHeading title={editando ? 'Editar empresa' : 'Registrar empresa'} description="Completa la información de la empresa y de su cuenta administrativa." />
    <div className="admin-empresa-columns">
      <form className="admin-card admin-form" ref={formulario} onSubmit={enviar} noValidate>
        <p className="admin-small admin-muted">{editando ? 'Todos los datos son obligatorios, excepto la nueva contraseña.' : 'Todos los campos son obligatorios.'}</p>
        {/* Fieldset y legend mantienen identificables los dos grupos con lectores de pantalla. */}
        <fieldset className="admin-empresa-section">
          <legend>Datos de la empresa</legend>
          <div className="admin-empresa-fields">{camposEmpresa.map(mostrarCampo)}</div>
        </fieldset>
        <fieldset className="admin-empresa-section">
          <legend>Cuenta del administrador</legend>
          <p className="admin-small admin-muted">Esta persona gestionará las rutas, los micros y los conductores de la empresa.</p>
          <div className="admin-empresa-fields">
            {camposAdministrador.map(mostrarCampo)}
            <div className="admin-field">
              <label htmlFor="empresa-contrasena">{editando ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'}</label>
              <div className="admin-input-wrap">
                <input id="empresa-contrasena" name="contrasena" type={mostrarContrasena ? 'text' : 'password'}
                  value={datos.contrasena} required={!editando} minLength={8} autoComplete="new-password"
                  aria-invalid={Boolean(errores.contrasena)} aria-describedby="empresa-contrasena-ayuda"
                  onChange={evento => cambiar('contrasena', evento.target.value)} onBlur={() => comprobarCampo('contrasena')} />
                <button type="button" className="admin-password-toggle" aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={mostrarContrasena} onClick={() => establecerMostrarContrasena(actual => !actual)}><img src={eye} alt="" width="20" height="20" /></button>
              </div>
              <p id="empresa-contrasena-ayuda" className={errores.contrasena ? 'admin-field-error' : 'admin-field-help'}>
                {errores.contrasena || (editando ? 'Déjala vacía para conservar la actual. Para cambiarla, utiliza al menos 8 caracteres.' : 'Utiliza al menos 8 caracteres y entrega el acceso al administrador.')}
              </p>
            </div>
          </div>
        </fieldset>
        <div className="admin-form-actions">
          <Link className="admin-button admin-outline" to={rutaEmpresas}>Cancelar</Link>
          <button type="submit" className="admin-button">{editando ? 'Guardar cambios' : 'Guardar empresa'}</button>
        </div>
        {pendiente && <p role="status" className="admin-pending">Los datos están completos. El guardado de la empresa y su cuenta administrativa está pendiente de conectar la API; no se guardaron cambios.</p>}
      </form>
      {/* Resumen sin contraseña: ayuda a revisar la identidad y evita exponer credenciales. */}
      <aside className="admin-card admin-context" aria-label="Resumen de empresa y administrador">
        <span className="admin-icon-tile"><Building2 size={24} aria-hidden="true" /></span>
        <h2>{datos.razonSocial.trim() || 'Tu nueva empresa'}</h2>
        <p className="admin-muted">Cada empresa gestiona su propia información.</p>
        <dl className="admin-assignment-summary">
          <dt>RUC</dt><dd>{datos.ruc.trim() || 'Por completar'}</dd>
          <dt>Administrador</dt><dd>{`${datos.nombre} ${datos.apellido}`.trim() || 'Por completar'}</dd>
          <dt>Correo de acceso</dt><dd>{datos.correo.trim() || 'Por completar'}</dd>
        </dl>
        <p className="admin-info-note"><ShieldCheck size={20} aria-hidden="true" />Entrega las credenciales al administrador. Su contraseña no se mostrará en el detalle.</p>
      </aside>
    </div>
    <PendingNotice />
  </>;
}
