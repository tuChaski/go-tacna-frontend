/**
 * Mapa compartido por edición y consulta. React Leaflet gestiona el ciclo de vida
 * del mapa; los puntos permanecen en el formulario. No solicita ubicación GPS,
 * no calcula recorridos por calles ni envía datos de la cuenta al proveedor.
 */
import { useEffect, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import type { PuntoRuta } from './trazado-ruta';
import 'leaflet/dist/leaflet.css';

interface PropiedadesMapa {
  puntos: readonly PuntoRuta[];
  seleccionando?: boolean;
  alSeleccionar?: (punto: PuntoRuta) => void;
}

/** Ajusta el encuadre solo al abrir o al pedirlo; añadir puntos no mueve el mapa. */
function InteraccionesMapa({ puntos, seleccionando, alSeleccionar, revision }: PropiedadesMapa & { revision: number }) {
  const mapa = useMapEvents({
    click(evento) {
      if (!seleccionando || !alSeleccionar) return;
      const coordenada = evento.latlng.wrap();
      alSeleccionar({ latitud: Number(coordenada.lat.toFixed(6)), longitud: Number(coordenada.lng.toFixed(6)) });
    },
  });
  const ultimaRevision = useRef(-1);
  useEffect(() => {
    if (ultimaRevision.current === revision) return;
    ultimaRevision.current = revision;
    if (puntos.length) mapa.fitBounds(puntos.map(punto => [punto.latitud, punto.longitud]), { padding: [36, 36], maxZoom: 15 });
  }, [mapa, puntos, revision]);

  // Vuelve a calcular el tamaño al cambiar de columnas o de orientación móvil.
  useEffect(() => {
    const observador = new ResizeObserver(() => mapa.invalidateSize({ pan: false }));
    observador.observe(mapa.getContainer());
    return () => observador.disconnect();
  }, [mapa]);
  return null;
}

/** Traduce los controles de Leaflet sin modificar otras instancias del proyecto. */
function ControlesMapa() {
  const mapa = useMap();
  useEffect(() => {
    const control = mapa.zoomControl;
    control.setPosition('topright');
    const contenedor = control.getContainer();
    const acercar = contenedor?.querySelector('a.leaflet-control-zoom-in');
    const alejar = contenedor?.querySelector('a.leaflet-control-zoom-out');
    acercar?.setAttribute('title', 'Acercar mapa');
    acercar?.setAttribute('aria-label', 'Acercar mapa');
    alejar?.setAttribute('title', 'Alejar mapa');
    alejar?.setAttribute('aria-label', 'Alejar mapa');
  }, [mapa]);
  return null;
}

export function MapaRuta({ puntos, seleccionando = false, alSeleccionar }: PropiedadesMapa) {
  const [revision, establecerRevision] = useState(0);
  const [intento, establecerIntento] = useState(0);
  const [errorBase, establecerErrorBase] = useState(false);
  const posiciones: [number, number][] = puntos.map(punto => [punto.latitud, punto.longitud]);
  return <div className="admin-mapa-bloque">
    <div role="region" aria-label="Mapa del recorrido en Tacna" className={seleccionando ? 'admin-mapa seleccionando' : 'admin-mapa'}>
      <MapContainer center={[-18.0066, -70.2463]} zoom={14} minZoom={2} maxZoom={19}
        scrollWheelZoom={false} doubleClickZoom={false} className="admin-mapa-lienzo">
        {/* Teselas visibles bajo demanda y atribución permanente; sin precarga masiva. */}
        <TileLayer key={intento} url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          eventHandlers={{ tileerror: () => establecerErrorBase(true) }} />
        <ControlesMapa />
        <InteraccionesMapa puntos={puntos} seleccionando={seleccionando} alSeleccionar={alSeleccionar} revision={revision} />
        {puntos.length >= 2 && <Polyline positions={posiciones} pathOptions={{ color: '#2563eb', weight: 5 }} interactive={false} />}
        {puntos.map((punto, indice) => <CircleMarker key={`${indice}-${punto.latitud}-${punto.longitud}`}
          center={[punto.latitud, punto.longitud]} radius={7} interactive={false}
          pathOptions={{ color: '#1d4ed8', fillColor: '#fff', fillOpacity: 1, weight: 3 }}>
          <Tooltip permanent direction="top" offset={[0, -8]}>{indice + 1}</Tooltip>
        </CircleMarker>)}
      </MapContainer>
    </div>
    <button type="button" className="admin-button admin-outline" disabled={!puntos.length} onClick={() => establecerRevision(actual => actual + 1)}>Ver recorrido completo</button>
    {errorBase && <div className="admin-info-note" role="status"><p>No se pudo cargar parte del mapa. Revisa tu conexión. Tus puntos siguen disponibles.</p>
      <button type="button" className="admin-button admin-outline" onClick={() => { establecerErrorBase(false); establecerIntento(actual => actual + 1); }}>Reintentar mapa</button></div>}
    <p className="admin-small admin-muted">La línea une los puntos en su orden. Añade puntos en curvas y cruces para seguir las calles.</p>
  </div>;
}
