import { lazy, Suspense, useState } from 'react';
import { IconoPublico } from '../../publico/IconoPublico';
import type { RutaInicio } from '../datos/tipos-inicio';
import { rutasRespaldo, microsRespaldo } from '../datos/rutas-respaldo';
import { TrazadoRutaSvg } from './TrazadoRutaSvg';
const Mapa3D = lazy(() => import('./MapaBuses3D').then(m => ({ default: m.MapaBuses3D })));

/** La demostración usa exclusivamente su propio conjunto ficticio, por acción
 * explícita. Nunca combina placas reales con posiciones o tiempos inventados. */
export function MockupApp({ rutas }: { rutas: readonly RutaInicio[] }) {
  const [demo, establecerDemo] = useState(false);
  const ruta = rutas.find(r => r.coordenadas.length >= 2);
  return <div className="gt-preview">
    <div className="gt-preview-cabecera"><strong>Tu ruta, de un vistazo</strong><span>Tacna</span></div>
    <div className="gt-preview-lienzo">{ruta ? <TrazadoRutaSvg ruta={ruta} className="w-full h-full" /> : <div className="gt-preview-vacio"><IconoPublico nombre="ruta" tamano={32} /><span>Explora las rutas de tu ciudad</span></div>}</div>
    <div className="gt-preview-pie"><span className="gt-preview-ubicacion"><IconoPublico nombre="ubicacion" tamano={16} /> {ruta ? ruta.nombre : 'Consulta sin cuenta'}</span><span>{ruta ? 'Esquema del recorrido registrado' : 'Vista de referencia'}</span></div>
    <button className="gt-demo-boton" type="button" aria-expanded={demo} aria-controls="demo-inicio" onClick={() => establecerDemo(v => !v)}><IconoPublico nombre="mapa" tamano={16} />{demo ? 'Cerrar demostración 3D' : 'Ver demostración 3D'}</button>
    {demo && <div className="gt-demo" id="demo-inicio"><p>Demostración visual con unidades y recorridos de ejemplo. No muestra ubicaciones actuales.</p><div className="gt-demo-lienzo"><Suspense fallback={<p role="status">Cargando demostración…</p>}><Mapa3D rutas={rutasRespaldo} micros={microsRespaldo} mostrarBusesDemo /></Suspense></div></div>}
  </div>;
}
