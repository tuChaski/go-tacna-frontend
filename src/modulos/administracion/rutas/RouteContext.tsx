import { Info, MapPin, Route as RouteIcon } from 'lucide-react';
import type { RouteFormValues } from './route-form';

/** Resumen del orden de los puntos; identifica extremos sin inventar nombres de
 * lugares que la API no publica. Las coordenadas son del recorrido, no del GPS.
 */
export function RouteContext({ values }: { values: RouteFormValues }) {
  const inicio = values.trazado[0];
  const final = values.trazado.at(-1);
  const describir = (punto: typeof inicio | undefined) => punto ? `${punto.latitud.toFixed(6)}, ${punto.longitud.toFixed(6)}` : 'Por definir';
  return <aside className="admin-card admin-context" aria-label="Resumen del recorrido">
    <span className="admin-icon-tile"><RouteIcon size={24} aria-hidden="true" /></span>
    <h2>{values.name.trim() || 'Tu nueva ruta'}</h2>
    <p className="admin-muted">{values.trazado.length} puntos en el recorrido.</p>
    <ol className="admin-itinerary">
      <li><MapPin size={20} aria-hidden="true" /><div><span>Inicio del recorrido</span><strong>{describir(inicio)}</strong></div></li>
      <li><MapPin size={20} aria-hidden="true" /><div><span>Final del recorrido</span><strong>{describir(final)}</strong></div></li>
    </ol>
    <div className="admin-info-note"><Info size={20} aria-hidden="true" /><p>Los micros recogen pasajeros cuando lo solicitan a lo largo del recorrido. Estas referencias no son paradas obligatorias.</p></div>
    <p className="admin-small admin-muted">Revisa el orden de los puntos antes de guardar. Este recorrido no representa posiciones en tiempo real.</p>
  </aside>;
}
