/** Formulario de nombre y trazado. La edición usa una copia del ejemplo;
 * validar el recorrido no implica persistirlo ni iniciar el seguimiento GPS.
 */
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { PageHeading } from '../componentes/PageHeading';
import { PendingNotice } from '../componentes/PendingNotice';
import { RouteContext } from './RouteContext';
import { routeFields, validateRouteForm } from './route-form';
import type { RouteFormErrors, RouteFormValues } from './route-form';
import { referenceRoute, routesPreviewPath } from './route-reference';
import { EditorTrazadoRuta } from './EditorTrazadoRuta';

export function RouteForm({ editing = false }: { editing?: boolean }) {
  const [values, setValues] = useState<RouteFormValues>(() => ({
    name: editing ? referenceRoute.name : '',
    trazado: editing ? referenceRoute.trazado.map(punto => ({ ...punto })) : [],
  }));
  const [errors, setErrors] = useState<RouteFormErrors>({});
  const [pending, setPending] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateRouteForm(values);
    setErrors(nextErrors);
    setPending(false);
    const firstInvalid = routeFields.find(field => nextErrors[field.key]);
    if (firstInvalid) {
      form.current?.querySelector<HTMLInputElement>(`#route-${firstInvalid.key}`)?.focus();
      return;
    }
    if (nextErrors.trazado) {
      form.current?.querySelector<HTMLElement>('#route-trazado')?.focus();
      return;
    }
    // El contrato ya está revisado; la llamada HTTP se añadirá en la integración.
    setPending(true);
  }

  return <>
    <Link className="admin-back-link" to={routesPreviewPath}><ArrowLeft size={18} aria-hidden="true" />Volver a rutas</Link>
    <PageHeading title={editing ? 'Editar ruta' : 'Registrar ruta'} description="Nombra la ruta y define su recorrido en el mapa." />
    <div className="admin-ruta-columns">
      <form className="admin-card admin-form" ref={form} onSubmit={handleSubmit} noValidate>
        <h2>Datos de la ruta</h2>
        <p className="admin-small admin-muted">El nombre y el recorrido son obligatorios.</p>
        {routeFields.map(field => <div className="admin-field" key={field.key}>
          <label htmlFor={`route-${field.key}`}>{field.label}</label>
          <input id={`route-${field.key}`} name={field.key} type="text" required autoComplete="off" maxLength={180}
            value={values[field.key]} placeholder={field.placeholder}
            aria-invalid={Boolean(errors[field.key])} aria-describedby={`route-${field.key}-help`}
            onBlur={() => setErrors(current => ({ ...current, [field.key]: validateRouteForm(values)[field.key] }))}
            onChange={event => {
              const nextValues = { ...values, [field.key]: event.target.value };
              setValues(nextValues);
              setPending(false);
              if (errors[field.key]) setErrors(current => ({ ...current, [field.key]: validateRouteForm(nextValues)[field.key] }));
            }} />
          <p id={`route-${field.key}-help`} className={errors[field.key] ? 'admin-field-error' : 'admin-field-help'}>{errors[field.key] || field.help}</p>
        </div>)}
        {/* Mantiene el mapa y los controles por teclado dentro del mismo formulario. */}
        <EditorTrazadoRuta puntos={values.trazado} error={errors.trazado} alCambiar={trazado => {
          const siguientes = { ...values, trazado };
          setValues(siguientes);
          setPending(false);
          if (errors.trazado) setErrors(actuales => ({ ...actuales, trazado: validateRouteForm(siguientes).trazado }));
        }} />
        <div className="admin-form-actions">
          <Link className="admin-button admin-outline" to={routesPreviewPath}>Cancelar</Link>
          <button type="submit" className="admin-button"><Save size={18} aria-hidden="true" />Guardar ruta</button>
        </div>
        {pending && <p className="admin-pending" role="status">Los campos están completos. El guardado requiere conectar la API; no se guardaron cambios.</p>}
      </form>
      <RouteContext values={values} />
    </div>
    <PendingNotice />
  </>;
}
