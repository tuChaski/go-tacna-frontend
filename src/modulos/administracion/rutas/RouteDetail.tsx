/** Consulta de nombre y geometría del ejemplo. El mapa solo permite explorar;
 * modificar los puntos requiere abrir el formulario de edición.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { PageHeading } from '../componentes/PageHeading';
import { PendingNotice } from '../componentes/PendingNotice';
import { RouteContext } from './RouteContext';
import { RouteActionDialog } from './RouteActionDialog';
import { routeFields } from './route-form';
import { referenceRoute, routesPreviewPath } from './route-reference';
import { MapaRuta } from './MapaRuta';

export function RouteDetail() {
  const [action, setAction] = useState<'state' | 'delete' | null>(null);

  return <>
    <Link className="admin-back-link" to={routesPreviewPath}><ArrowLeft size={18} aria-hidden="true" />Volver a rutas</Link>
    <PageHeading title={referenceRoute.name} description="Consulta los datos del recorrido antes de editarlo o cambiar su estado." />
    <div className="admin-columns">
      <section className="admin-card admin-detail">
        <div className="admin-detail-heading"><h2>Datos de la ruta</h2><span className="admin-status-badge">Activa</span></div>
        <dl>{routeFields.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{referenceRoute[field.key]}</dd></div>)}</dl>
        <div className="admin-form-actions">
          <button type="button" className="admin-button admin-outline" onClick={() => setAction('state')}>Cambiar estado</button>
          <Link className="admin-button" to={`${routesPreviewPath}/${referenceRoute.id}/editar`}><Pencil size={18} aria-hidden="true" />Editar ruta</Link>
        </div>
        <div className="admin-delete-section"><p className="admin-small admin-muted">Eliminar borra definitivamente; desactivar conserva la información.</p><button type="button" className="admin-button admin-delete-outline" onClick={() => setAction('delete')}><Trash2 size={18} aria-hidden="true" />Eliminar ruta</button></div>
      </section>
      <RouteContext values={referenceRoute} />
    </div>
    <section className="admin-card admin-form" aria-label="Recorrido de la ruta de ejemplo">
      <h2>Recorrido en el mapa</h2>
      <p className="admin-small admin-muted">Ejemplo para revisar el diseño; no es un recorrido de transporte verificado.</p>
      <MapaRuta puntos={referenceRoute.trazado} />
      <details><summary>Consultar coordenadas del recorrido</summary><ol className="admin-puntos-consulta">
        {referenceRoute.trazado.map((punto, indice) => <li key={indice}>Punto {indice + 1}: {punto.latitud.toFixed(6)}, {punto.longitud.toFixed(6)}</li>)}
      </ol></details>
    </section>
    <PendingNotice />
    {action && <RouteActionDialog action={action} onClose={() => setAction(null)} />}
  </>;
}
