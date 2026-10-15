import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { PageHeading } from '../components/PageHeading';
import { PendingNotice } from '../components/PendingNotice';
import { RouteContext } from './RouteContext';
import { routeFields, validateRouteForm } from './route-form';
import type { RouteFormErrors, RouteFormValues } from './route-form';
import { referenceRoute, routesPreviewPath } from './route-reference';

export function RouteForm({ editing = false }: { editing?: boolean }) {
  const [values, setValues] = useState<RouteFormValues>(() => ({
    name: editing ? referenceRoute.name : '',
    originDestination: editing ? referenceRoute.originDestination : '',
    startReference: editing ? referenceRoute.startReference : '',
    endReference: editing ? referenceRoute.endReference : '',
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
    // Conectar aquí el servicio cuando exista contrato. No simular un guardado exitoso.
    setPending(true);
  }

  return <>
    <Link className="admin-back-link" to={routesPreviewPath}><ArrowLeft size={18} aria-hidden="true" />Volver a rutas</Link>
    <PageHeading title={editing ? 'Editar ruta' : 'Registrar ruta'} description="Define el recorrido de tu empresa y sus puntos de referencia." />
    <div className="admin-columns">
      <form className="admin-card admin-form" ref={form} onSubmit={handleSubmit} noValidate>
        <h2>Datos de la ruta</h2>
        <p className="admin-small admin-muted">Todos los campos son obligatorios.</p>
        {routeFields.map(field => <div className="admin-field" key={field.key}>
          <label htmlFor={`route-${field.key}`}>{field.label}</label>
          <input id={`route-${field.key}`} name={field.key} type="text" required autoComplete="off"
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
