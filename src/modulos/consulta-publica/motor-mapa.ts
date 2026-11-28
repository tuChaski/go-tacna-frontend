import type * as MapLibre from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import type { MicroPublico, RutaPublica } from './contrato-publico.ts';
import { limitesRecorrido, validarPosicionPublica } from './datos-mapa.ts';
import { CENTRO_TACNA, estiloMapaPublico, solicitudMapa } from './proveedor-mapa.ts';

export interface SeleccionMapa {
  ruta: RutaPublica | null;
  micros: MicroPublico[];
  seleccionado: number | null;
  alSeleccionar: (id: number, origen: HTMLElement) => void;
}
export type EstadoMapa = 'cargando' | 'listo' | 'teselas' | 'grafico';
type Biblioteca = Pick<typeof MapLibre, 'Map' | 'Marker' | 'AttributionControl'>;

/** Una instancia por montaje. La cámara solo se ajusta al cambiar la ruta;
 * tarjetas, selección de micro y actualizaciones no modifican la vista manual.
 * La biblioteca se inyecta para probar limpieza y eventos sin usar WebGL. */
export function crearMotorMapa(lib: Biblioteca, contenedor: HTMLElement, avisar: (estado: EstadoMapa) => void,
  crearBoton = () => document.createElement('button')) {
  const mapa = new lib.Map({
    container: contenedor, style: estiloMapaPublico(), center: CENTRO_TACNA, zoom: 12.5,
    minZoom: 2, maxZoom: 19, attributionControl: false, renderWorldCopies: false,
    dragRotate: false, pitchWithRotate: false, touchPitch: false,
    transformRequest: solicitudMapa,
    // No se precargan niveles ni rutas fuera de la vista que se está consultando.
    maxTileCacheSize: 64, fadeDuration: 0,
  });
  mapa.touchZoomRotate.disableRotation();
  mapa.addControl(new lib.AttributionControl({ compact: false }), 'bottom-right');
  mapa.getCanvas().setAttribute('aria-label', 'Mapa de Tacna. Usa las flechas para desplazar y más o menos para acercar. Tab para salir.');
  let dispuesto = false, destruido = false, falloTeselas = false, rutaEncuadrada: number | null = null;
  let trazadoAnterior: RutaPublica | null | undefined;
  let estado: SeleccionMapa = { ruta: null, micros: [], seleccionado: null, alSeleccionar: () => {} };
  const marcadores = new Map<number, { marcador: MapLibre.Marker; boton: HTMLButtonElement; clic: () => void }>();

  function verRecorrido() {
    const limites = limitesRecorrido(estado.ruta?.coordenadas ?? []);
    if (limites) mapa.fitBounds(limites, { padding: 40, maxZoom: 16, duration: 0 });
    else mapa.jumpTo({ center: CENTRO_TACNA, zoom: 12.5 });
  }
  function dibujar() {
    if (!dispuesto || destruido) return;
    const ruta = estado.ruta;
    const coordenadas = ruta?.coordenadas ?? [];
    const datos: FeatureCollection = { type: 'FeatureCollection', features: limitesRecorrido(coordenadas) ? [{
      type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coordenadas.map(p => [p.longitud, p.latitud]) },
    }] : [] };
    if (ruta !== trazadoAnterior) {
      (mapa.getSource('recorrido-publico') as MapLibre.GeoJSONSource).setData(datos);
      trazadoAnterior = ruta;
    }
    if ((ruta?.id ?? null) !== rutaEncuadrada) {
      rutaEncuadrada = ruta?.id ?? null;
      verRecorrido();
    }
    const vigentes = new Set<number>();
    for (const micro of estado.micros) {
      const posicion = validarPosicionPublica(micro.posicion);
      if (!ruta || micro.rutaId !== ruta.id || !posicion) continue;
      vigentes.add(micro.id);
      let registro = marcadores.get(micro.id);
      if (!registro) {
        const boton = crearBoton();
        boton.type = 'button';
        boton.textContent = 'BUS';
        const clic = () => estado.alSeleccionar(micro.id, boton);
        boton.addEventListener('click', clic);
        const marcador = new lib.Marker({ element: boton, anchor: 'bottom' }).setLngLat([posicion.longitud, posicion.latitud]).addTo(mapa);
        registro = { marcador, boton, clic };
        marcadores.set(micro.id, registro);
      }
      registro.marcador.setLngLat([posicion.longitud, posicion.latitud]);
      registro.boton.className = `cp-marcador${estado.seleccionado === micro.id ? ' cp-marcador-seleccionado' : ''}`;
      registro.boton.setAttribute('aria-label', `Ver detalle del micro ${micro.placa}`);
      registro.boton.setAttribute('aria-pressed', String(estado.seleccionado === micro.id));
      registro.boton.title = micro.placa;
    }
    for (const [id, registro] of marcadores) {
      if (vigentes.has(id)) continue;
      registro.boton.removeEventListener('click', registro.clic);
      registro.marcador.remove(); marcadores.delete(id);
    }
  }
  function cargar() {
    if (destruido || dispuesto) return;
    mapa.addSource('recorrido-publico', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    mapa.addLayer({ id: 'recorrido-borde', type: 'line', source: 'recorrido-publico',
      layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 9 } });
    mapa.addLayer({ id: 'recorrido-linea', type: 'line', source: 'recorrido-publico',
      layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#1d4ed8', 'line-width': 5 } });
    dispuesto = true; dibujar(); avisar(falloTeselas ? 'teselas' : 'listo');
  }
  const fallo = () => { falloTeselas = true; if (!destruido) avisar('teselas'); };
  const perderContexto = () => { if (!destruido) avisar('grafico'); };
  const restaurarContexto = () => { if (!destruido) { mapa.resize(); avisar(falloTeselas ? 'teselas' : dispuesto ? 'listo' : 'cargando'); } };
  mapa.on('load', cargar);
  mapa.on('error', fallo);
  mapa.on('webglcontextlost', perderContexto);
  mapa.on('webglcontextrestored', restaurarContexto);
  return {
    actualizar(seleccion: SeleccionMapa) { estado = seleccion; dibujar(); },
    verRecorrido,
    acercar(delta: number) { mapa.zoomTo(mapa.getZoom() + delta, { duration: 0 }); },
    redimensionar() { if (!destruido) mapa.resize(); },
    destruir() {
      if (destruido) return;
      destruido = true;
      mapa.off('load', cargar); mapa.off('error', fallo);
      mapa.off('webglcontextlost', perderContexto); mapa.off('webglcontextrestored', restaurarContexto);
      for (const registro of marcadores.values()) {
        registro.boton.removeEventListener('click', registro.clic); registro.marcador.remove();
      }
      marcadores.clear();
      // remove elimina canvas, controles, peticiones, fuentes, capas y workers.
      mapa.remove();
    },
  };
}
