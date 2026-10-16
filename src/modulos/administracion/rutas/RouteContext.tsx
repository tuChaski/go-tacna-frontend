import { Info, MapPin, Route as RouteIcon } from 'lucide-react';
import type { RouteFormValues } from './route-form';

/** Resumen textual del formulario: no simula coordenadas ni un trazado real. */
export function RouteContext({ values }: { values: RouteFormValues }) {
  return <aside className="admin-card admin-context" aria-label="Resumen del recorrido">
    <span className="admin-icon-tile"><RouteIcon size={24} aria-hidden="true" /></span>
    <h2>{values.name.trim() || 'Tu nueva ruta'}</h2>
    <p className="admin-muted">{values.originDestination.trim() || 'Define las zonas que conecta esta ruta.'}</p>
    <ol className="admin-itinerary">
      <li><MapPin size={20} aria-hidden="true" /><div><span>Referencia inicial</span><strong>{values.startReference.trim() || 'Por completar'}</strong></div></li>
      <li><MapPin size={20} aria-hidden="true" /><div><span>Referencia final</span><strong>{values.endReference.trim() || 'Por completar'}</strong></div></li>
    </ol>
    <div className="admin-info-note"><Info size={20} aria-hidden="true" /><p>Los micros recogen pasajeros cuando lo solicitan a lo largo del recorrido. Estas referencias no son paradas obligatorias.</p></div>
    <p className="admin-small admin-muted">El trazado geográfico se incorporará al integrar el servicio de mapas.</p>
  </aside>;
}
