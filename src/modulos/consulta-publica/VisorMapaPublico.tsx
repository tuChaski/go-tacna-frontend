import { useEffect, useRef, useState } from 'react';
import { CircleAlert, MapPin, Maximize, Minus, Plus, RefreshCw } from 'lucide-react';
import { crearMotorMapa } from './motor-mapa';
import type { EstadoMapa, SeleccionMapa } from './motor-mapa';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';

const mensajes = {
  cargando: 'Cargando el mapa de Tacna…',
  listo: '',
  teselas: 'No pudimos cargar las calles del mapa. Puedes seguir consultando las rutas y los micros en el listado.',
  grafico: 'El navegador no pudo mantener los gráficos del mapa. Las rutas y el detalle siguen disponibles en el listado.',
};

export default function VisorMapaPublico(props: SeleccionMapa) {
  const [intento, establecerIntento] = useState(0);
  return <InstanciaMapa key={intento} {...props} reintentar={() => establecerIntento(actual => actual + 1)} />;
}

function InstanciaMapa({ reintentar, ruta, micros, seleccionado, alSeleccionar }: SeleccionMapa & { reintentar: () => void }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const motor = useRef<ReturnType<typeof crearMotorMapa> | null>(null);
  const actual = useRef({ ruta, micros, seleccionado, alSeleccionar });
  const [estado, establecerEstado] = useState<EstadoMapa>('cargando');
  useEffect(() => {
    const seleccion = { ruta, micros, seleccionado, alSeleccionar };
    actual.current = seleccion;
    motor.current?.actualizar(seleccion);
  }, [ruta, micros, seleccionado, alSeleccionar]);
  useEffect(() => {
    let cancelado = false;
    // El import se espera antes de crear el mapa. StrictMode puede desmontar
    // mientras llega el módulo: ese montaje abandonado nunca crea una instancia.
    void import('maplibre-gl').then(lib => {
      if (cancelado || !contenedor.current) return;
      // Vite renombra los módulos: la autodetección de MapLibre no encuentra
      // su worker hermano. Se empaqueta como módulo local y se fija antes del mapa.
      lib.setWorkerUrl(workerUrl);
      const visor = crearMotorMapa(lib, contenedor.current, establecerEstado);
      motor.current = visor;
      visor.actualizar(actual.current);
    }).catch(() => { if (!cancelado) establecerEstado('grafico'); });
    const redimensionar = () => motor.current?.redimensionar();
    const observador = new ResizeObserver(redimensionar);
    if (contenedor.current) observador.observe(contenedor.current);
    const demora = window.setTimeout(() => {
      if (!cancelado) establecerEstado(anterior => anterior === 'cargando' ? 'teselas' : anterior);
    }, 20000);
    return () => {
      cancelado = true; window.clearTimeout(demora); observador.disconnect();
      motor.current?.destruir(); motor.current = null;
    };
  }, []);
  const error = estado === 'teselas' || estado === 'grafico';
  return <figure className="cp-visor" aria-label="Recorrido geográfico de la ruta">
    <div className="cp-herramientas-mapa">
      <span><MapPin size={17} aria-hidden="true" /> Tacna, Perú</span>
      <button type="button" className="cp-boton cp-secundario" onClick={() => motor.current?.verRecorrido()} disabled={estado === 'cargando' || estado === 'grafico'}>
        <Maximize size={17} aria-hidden="true" />{ruta?.coordenadas.length ? 'Ver todo el recorrido' : 'Volver a Tacna'}
      </button>
    </div>
    <p className="cp-instrucciones-mapa" id="instrucciones-mapa">Arrastra para explorar. Usa + y − para cambiar el zoom. También puedes consultar todo desde el listado.</p>
    <div className="cp-lienzo-mapa">
      <div ref={contenedor} className="cp-maplibre" aria-describedby="instrucciones-mapa" />
      <div className="cp-zoom" aria-label="Zoom del mapa">
        <button type="button" aria-label="Acercar mapa" disabled={estado === 'cargando' || estado === 'grafico'} onClick={() => motor.current?.acercar(1)}><Plus size={21} aria-hidden="true" /></button>
        <button type="button" aria-label="Alejar mapa" disabled={estado === 'cargando' || estado === 'grafico'} onClick={() => motor.current?.acercar(-1)}><Minus size={21} aria-hidden="true" /></button>
      </div>
    </div>
    {estado !== 'listo' && <div className={error ? 'cp-aviso-mapa cp-fallo-mapa' : 'cp-aviso-mapa'} role={error ? 'alert' : 'status'}>
      {error && <CircleAlert size={19} aria-hidden="true" />}<p>{mensajes[estado]}</p>
      {error && <button type="button" className="cp-boton cp-secundario" onClick={reintentar}><RefreshCw size={16} aria-hidden="true" />Reintentar mapa</button>}
    </div>}
    <figcaption><span className="cp-leyenda-linea" aria-hidden="true" />{ruta?.coordenadas.length ? 'Recorrido registrado.' : ruta ? 'Mapa de referencia de Tacna.' : 'Selecciona una ruta para ver su recorrido.'}
      <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noopener noreferrer">Informar un error del mapa</a>
    </figcaption>
  </figure>;
}
