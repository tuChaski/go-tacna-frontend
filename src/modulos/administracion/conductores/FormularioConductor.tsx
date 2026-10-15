/** Registro y edición de un conductor: estado temporal, validación y accesibilidad. */
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Save } from 'lucide-react';
import { PageHeading } from '../componentes/PageHeading';
import { PendingNotice } from '../componentes/PendingNotice';
import { ContextoConductor } from './ContextoConductor';
import { conductorReferencia, rutaConductores } from './conductor-referencia';
import { camposDatosConductor, validarConductor } from './formulario-conductor';
import type { DatosFormularioConductor, ErroresConductor } from './formulario-conductor';

export function FormularioConductor({ editando = false }: { editando?: boolean }) {
  // La contraseña siempre inicia vacía; nunca se recupera del registro existente.
  const [datos, establecerDatos] = useState<DatosFormularioConductor>(() => ({
    nombreCompleto: editando ? conductorReferencia.nombreCompleto : '',
    documento: editando ? conductorReferencia.documento : '',
    correo: editando ? conductorReferencia.correo : '',
    contrasena: '',
  }));
  const [errores, establecerErrores] = useState<ErroresConductor>({});
  const [mostrarContrasena, establecerMostrarContrasena] = useState(false);
  const [pendiente, establecerPendiente] = useState(false);
  const formulario = useRef<HTMLFormElement>(null);

  // Al corregir un campo se limpia su error y cualquier aviso anterior de envío.
  function cambiarCampo(clave: keyof DatosFormularioConductor, valor: string) {
    const siguientes = { ...datos, [clave]: valor };
    establecerDatos(siguientes);
    establecerPendiente(false);
    if (errores[clave]) {
      establecerErrores(actuales => ({ ...actuales, [clave]: validarConductor(siguientes, !editando)[clave] }));
    }
  }

  function revisarCampo(clave: keyof DatosFormularioConductor) {
    establecerErrores(actuales => ({ ...actuales, [clave]: validarConductor(datos, !editando)[clave] }));
  }

  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const siguientesErrores = validarConductor(datos, !editando);
    establecerErrores(siguientesErrores);
    establecerPendiente(false);

    // El orden coincide con los controles y facilita corregir con teclado.
    const orden: (keyof DatosFormularioConductor)[] = ['nombreCompleto', 'documento', 'correo', 'contrasena'];
    const primerError = orden.find(clave => siguientesErrores[clave]);
    if (primerError) {
      formulario.current?.querySelector<HTMLInputElement>(`#conductor-${primerError}`)?.focus();
      return;
    }

    // Punto de integración futuro: confirmar éxito solo después de una respuesta real.
    establecerPendiente(true);
  }

  return (
    <>
      <Link className="admin-back-link" to={rutaConductores}>
        <ArrowLeft size={18} aria-hidden="true" />Volver a conductores
      </Link>
      <PageHeading
        title={editando ? 'Editar conductor' : 'Registrar conductor'}
        description="Completa los datos del conductor y su acceso a la aplicación."
      />
      <div className="admin-columns">
        <form className="admin-card admin-form" ref={formulario} onSubmit={guardar} noValidate>
          <h2>Datos del conductor</h2>
          <p className="admin-small admin-muted">
            {editando ? 'Los datos son obligatorios. Cambiar la contraseña es opcional.' : 'Todos los campos son obligatorios.'}
          </p>

          {/* Datos personales y correo comparten el mismo patrón de ayuda y error. */}
          {camposDatosConductor.map(campo => (
            <div className="admin-field" key={campo.clave}>
              <label htmlFor={`conductor-${campo.clave}`}>{campo.etiqueta}</label>
              <input
                id={`conductor-${campo.clave}`}
                name={campo.clave}
                type={campo.tipo}
                autoComplete="off"
                required
                placeholder={campo.ejemplo}
                value={datos[campo.clave]}
                aria-invalid={Boolean(errores[campo.clave])}
                aria-describedby={`conductor-${campo.clave}-ayuda`}
                onBlur={() => revisarCampo(campo.clave)}
                onChange={evento => cambiarCampo(campo.clave, evento.target.value)}
              />
              <p id={`conductor-${campo.clave}-ayuda`} className={errores[campo.clave] ? 'admin-field-error' : 'admin-field-help'}>
                {errores[campo.clave] || campo.ayuda}
              </p>
            </div>
          ))}

          {/* Mostrar u ocultar afecta únicamente al campo en edición. */}
          <div className="admin-field">
            <label htmlFor="conductor-contrasena">{editando ? 'Nueva contraseña' : 'Contraseña inicial'}</label>
            <div className="admin-input-wrap">
              <input
                id="conductor-contrasena"
                name="password"
                type={mostrarContrasena ? 'text' : 'password'}
                autoComplete="new-password"
                required={!editando}
                placeholder={editando ? 'Conservar la contraseña actual' : 'Contraseña inicial'}
                value={datos.contrasena}
                aria-invalid={Boolean(errores.contrasena)}
                aria-describedby="conductor-contrasena-ayuda"
                onBlur={() => revisarCampo('contrasena')}
                onChange={evento => cambiarCampo('contrasena', evento.target.value)}
              />
              <button
                type="button"
                className="admin-password-toggle"
                aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={mostrarContrasena}
                onClick={() => establecerMostrarContrasena(actual => !actual)}
              >
                {mostrarContrasena ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
              </button>
            </div>
            <p id="conductor-contrasena-ayuda" className={errores.contrasena ? 'admin-field-error' : 'admin-field-help'}>
              {errores.contrasena || (editando
                ? 'Opcional. Déjala vacía para conservar la contraseña actual.'
                : 'La empresa entrega estas credenciales al conductor.')}
            </p>
          </div>

          <div className="admin-form-actions">
            <Link className="admin-button admin-outline" to={rutaConductores}>Cancelar</Link>
            <button type="submit" className="admin-button"><Save size={18} aria-hidden="true" />Guardar conductor</button>
          </div>
          {pendiente && (
            <p className="admin-pending" role="status">
              Los campos están completos. El guardado requiere conectar la API; no se guardaron cambios ni se crearon credenciales.
            </p>
          )}
        </form>
        <ContextoConductor nombre={datos.nombreCompleto} />
      </div>
      <PendingNotice />
    </>
  );
}
