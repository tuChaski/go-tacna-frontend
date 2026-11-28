import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { IconoPublico } from '../publico/IconoPublico';
import { apiPublica } from '../../services/api';
import { CabeceraPublica } from '../publico/CabeceraPublica';
import VisorMapaPublico from './VisorMapaPublico';
import type { MicroPublico, RutaPublica } from './contrato-publico';
import { textoFechaPosicion } from './datos-mapa';
import { crearConsultaPublica } from './servicio-consulta';
import { useLecturaPublica } from './useLecturaPublica';
import '@fontsource-variable/inter';
import './consulta-publica.css';

const consulta = crearConsultaPublica(apiPublica);
const SIN_MICROS: MicroPublico[] = [];

/** La selección es única y local. El catálogo no comparte el recorte ni los
 * ejemplos de la landing: todos los resultados se confirman con la API. */
export function ConsultaPublica() {

  const [texto, establecerTexto] = useState('');
  const [filtro, establecerFiltro] = useState({ busqueda: '', pagina: 1, revision: 0 });
  const [ruta, establecerRuta] = useState<RutaPublica | null>(() => {
    const parametro = new URLSearchParams(window.location.search).get('ruta') ?? '';
    const id = Number(parametro);
    // El enlace de la landing solo propone un ID: el detalle se vuelve a
    // consultar y validar en la API, sin confiar en la URL como autorización.
    return /^[1-9]\d*$/.test(parametro) && Number.isSafeInteger(id)
      ? { id, nombre: '', empresa: '', coordenadas: [] } : null;
  });
  const cargar = useCallback((signal: AbortSignal) => consulta.rutas(filtro.busqueda, filtro.pagina, signal), [filtro.busqueda, filtro.pagina]);
  const lectura = useLecturaPublica(JSON.stringify(filtro), cargar);
  // La API busca sobre todo el catálogo; las páginas no se filtran en memoria.
  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      const busqueda = texto.trim();
      establecerFiltro(actual => actual.busqueda === busqueda ? actual : { ...actual, busqueda, pagina: 1 });
    }, 300);
    return () => window.clearTimeout(temporizador);
  }, [texto]);
  function buscar(evento: FormEvent) {
    evento.preventDefault();
    const busqueda = texto.trim();
    establecerFiltro(actual => actual.busqueda === busqueda && actual.pagina === 1 ? actual : { ...actual, busqueda, pagina: 1 });
  }
  function limpiar() { establecerTexto(''); establecerFiltro(actual => ({ ...actual, busqueda: '', pagina: 1 })); document.getElementById('buscar-ruta-publica')?.focus(); }
  function cerrarRuta() {
    const id = ruta?.id;
    // El botón sigue montado: devolver el foco antes de retirar el panel evita
    // depender de un frame futuro, que puede pausarse en pestañas de fondo.
    (document.getElementById(`ruta-publica-${id}`) ?? document.getElementById('buscar-ruta-publica'))?.focus();
    establecerRuta(null);
  }
  return <div className="consulta-publica gt-web">
    <a className="cp-saltar" href="#consulta-contenido">Saltar a la consulta</a>
    <CabeceraPublica mapa />
    <main id="consulta-contenido" className="cp-ancho">
      <section className="cp-presentacion" aria-labelledby="consulta-titulo"><div><h1 id="consulta-titulo">Consulta de rutas</h1><p>Elige una ruta para explorar su recorrido y sus micros. Sin crear una cuenta.</p></div></section>
      <div className="cp-columnas">
        <section className="cp-panel cp-directorio" aria-labelledby="rutas-titulo">
          <div className="cp-titulo-panel"><div><h2 id="rutas-titulo">Busca tu ruta</h2></div><span className="cp-icono"><IconoPublico nombre="ruta" tamano={20} /></span></div>
          <form className="cp-buscador" onSubmit={buscar} role="search" aria-label="Buscar rutas de Tacna">
            <label htmlFor="buscar-ruta-publica">Nombre de la ruta</label><div className="cp-campo-busqueda"><IconoPublico nombre="buscar" tamano={20} /><input id="buscar-ruta-publica" type="search" maxLength={180} placeholder="Escribe el nombre de la ruta" value={texto} onChange={evento => establecerTexto(evento.target.value)} /></div>
            <div className="cp-botones-busqueda"><button className="cp-boton cp-secundario" type="button" onClick={limpiar} disabled={!texto && !filtro.busqueda}>Limpiar búsqueda</button></div>
          </form>

        </section>
        <div className="cp-consulta-ruta"><PanelRuta rutaId={ruta?.id ?? null} alCerrar={cerrarRuta} /></div>
          <div className="cp-panel cp-explorador">{ruta && <div className="cp-resumen-seleccion"><span>Tu selección</span><strong>{ruta.nombre || 'Ruta seleccionada'}</strong><a href="#unidades-titulo">Consultar micros de esta ruta</a></div>}<div className="cp-separador"><h3>Rutas disponibles</h3><button className="cp-texto-boton" type="button" disabled={lectura.cargando} onClick={() => establecerFiltro(actual => ({ ...actual, revision: actual.revision + 1 }))}><IconoPublico nombre="actualizar" tamano={16} />Actualizar rutas</button></div>
          {texto.trim() !== filtro.busqueda || lectura.cargando ? <Cargando texto="Consultando rutas…" /> : lectura.error ? <ErrorConsulta mensaje={lectura.error} reintentar={() => establecerFiltro(actual => ({ ...actual, pagina: 1, revision: actual.revision + 1 }))} /> : lectura.datos && <>
            <p className="cp-resultados" role="status">{lectura.datos.total} {lectura.datos.total === 1 ? 'ruta encontrada' : 'rutas encontradas'}{filtro.busqueda ? ` para «${filtro.busqueda}»` : ' en el catálogo'}</p>
            {lectura.datos.registros.length ? <ul className="cp-lista-rutas">{lectura.datos.registros.map(item => <li key={item.id}><button type="button" id={`ruta-publica-${item.id}`} className={`cp-tarjeta-ruta${ruta?.id === item.id ? ' cp-seleccionada' : ''}`} aria-pressed={ruta?.id === item.id} onClick={() => establecerRuta(item)}>
              <span className="cp-icono"><IconoPublico nombre="ruta" tamano={20} /></span><span className="cp-info-ruta"><strong>{item.nombre}</strong><span>{item.empresa}</span><span className="cp-estado"><IconoPublico nombre="comprobar" tamano={16} />{ruta?.id === item.id ? 'Ruta seleccionada' : 'Ruta activa'}</span></span><IconoPublico nombre="siguiente" tamano={20} />
            </button></li>)}</ul> : <EstadoVacio titulo={filtro.busqueda ? 'No encontramos esa ruta' : 'Aún no hay rutas publicadas'} texto={filtro.busqueda ? 'Prueba con otro nombre o vuelve a ver todas las rutas.' : 'Vuelve a consultar más adelante.'} />}
            <Paginacion pagina={lectura.datos.pagina} ultima={lectura.datos.ultima} nombre="rutas" alCambiar={pagina => establecerFiltro(actual => ({ ...actual, pagina }))} />
          </>}</div>
      </div>
      <footer className="cp-pie"><span>Go Tacna · Rutas que conectan tu ciudad</span><p>Consulta de catálogo. El seguimiento en vivo se incorporará en otra etapa.</p></footer>
    </main>
  </div>;
}

/** Un visor estable durante la búsqueda, la paginación y el cambio de ruta. */
function PanelRuta({ rutaId, alCerrar }: { rutaId: number | null; alCerrar: () => void }) {
  const [revisionRuta, establecerRevisionRuta] = useState(0);
  const cargarRuta = useCallback((signal: AbortSignal) => rutaId === null ? Promise.resolve(null) : consulta.ruta(rutaId, signal), [rutaId]);
  const detalle = useLecturaPublica(`${rutaId}-${revisionRuta}`, cargarRuta);
  const ruta = detalle.datos ?? null;
  const [paginado, establecerPaginado] = useState({ rutaId, pagina: 1 });
  const pagina = paginado.rutaId === rutaId ? paginado.pagina : 1;
  const establecerPagina = (pagina: number) => establecerPaginado({ rutaId, pagina });
  const [revision, establecerRevision] = useState(0);
  const [seleccion, establecerSeleccion] = useState<{ rutaId: number | null; id: number } | null>(null);
  const seleccionado = seleccion?.rutaId === rutaId ? seleccion.id : null;
  const establecerSeleccionado = (id: number | null) => establecerSeleccion(id === null ? null : { rutaId, id });
  // Reiniciar la unidad y su página al cambiar de ruta sin desmontar el visor.
  const [rutaAnterior, establecerRutaAnterior] = useState(rutaId);
  if (rutaAnterior !== rutaId) {
    establecerRutaAnterior(rutaId);
    establecerPaginado({ rutaId, pagina: 1 });
    establecerSeleccion(null);
  }
  const origenSeleccion = useRef<HTMLElement | null>(null);
  const seleccionar = useCallback((id: number, origen: HTMLElement) => {
    origenSeleccion.current = origen;
    establecerSeleccion({ rutaId, id });
  }, [rutaId]);
  const cargar = useCallback((signal: AbortSignal) => ruta ? consulta.micros(ruta.id, pagina, signal) : Promise.resolve(null), [ruta, pagina]);
  const lectura = useLecturaPublica(`${ruta?.id}-${pagina}-${revision}`, cargar);
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (rutaId !== null) titulo.current?.focus(); }, [rutaId]);
  function cerrarDetalle() {
    (origenSeleccion.current?.isConnected ? origenSeleccion.current : document.getElementById(`micro-publico-${seleccionado}`) ?? document.getElementById('unidades-titulo'))?.focus();
    establecerSeleccionado(null);
  }
  return <section className="cp-panel cp-ruta-detalle" aria-labelledby="ruta-seleccionada-titulo">
    <div className="cp-titulo-panel"><div><h2 ref={titulo} tabIndex={-1} id="ruta-seleccionada-titulo">{ruta?.nombre ?? (rutaId === null ? 'Explora Tacna' : 'Consultar ruta')}</h2>{ruta && <p className="cp-empresa">{ruta.empresa}</p>}</div>{rutaId !== null && <button className="cp-boton-icono" type="button" aria-label="Cerrar ruta seleccionada" onClick={alCerrar}><IconoPublico nombre="cerrar" tamano={20} /></button>}</div>
    {rutaId === null ? <p className="cp-ayuda">Elige una ruta del catálogo para ver su recorrido y sus micros.</p> : detalle.cargando ? <p role="status" className="cp-ayuda">Consultando el detalle de la ruta…</p> : detalle.error ? <ErrorConsulta mensaje={detalle.error} reintentar={() => establecerRevisionRuta(actual => actual + 1)} /> : null}
    <VisorMapaPublico ruta={ruta} micros={lectura.datos?.registros ?? SIN_MICROS} seleccionado={seleccionado} alSeleccionar={seleccionar} />
    {ruta && !ruta.coordenadas.length && <div className="cp-sin-trazado" role="status"><IconoPublico nombre="ubicacion" tamano={20} /><p>{ruta.trazadoInvalido ? 'El trazado recibido no es compatible. Puedes consultar los micros de esta ruta.' : 'Esta ruta aún no tiene un trazado publicado. Puedes consultar sus micros.'}</p></div>}
    {ruta && <>{seleccionado !== null && <DetalleMicro key={`${seleccionado}-${revision}`} id={seleccionado} ruta={ruta} alCerrar={cerrarDetalle} />}<section className="cp-unidades" aria-labelledby="unidades-titulo">
    <div className="cp-separador"><h3 id="unidades-titulo" tabIndex={-1}>Micros activos</h3><button className="cp-texto-boton" type="button" disabled={lectura.cargando} onClick={() => establecerRevision(actual => actual + 1)}><IconoPublico nombre="actualizar" tamano={16} />Actualizar micros</button></div>
    <p className="cp-ayuda">Incluye unidades disponibles y en recorrido. El estado no indica cercanía ni tiempo de llegada.</p>
    {lectura.cargando ? <Cargando texto="Consultando micros de esta ruta…" /> : lectura.error ? <ErrorConsulta mensaje={lectura.error} reintentar={() => { establecerPagina(1); establecerRevision(actual => actual + 1); }} /> : lectura.datos && <>
      <p className="cp-resultados" role="status">{lectura.datos.total} {lectura.datos.total === 1 ? 'micro activo' : 'micros activos'}</p>
      {lectura.datos.registros.length ? <ul className="cp-lista-micros">{lectura.datos.registros.map(micro => <li key={micro.id}><button className={`cp-tarjeta-micro${seleccionado === micro.id ? ' cp-seleccionada' : ''}`} type="button" id={`micro-publico-${micro.id}`} onClick={evento => seleccionar(micro.id, evento.currentTarget)} aria-expanded={seleccionado === micro.id}>
        <span className="cp-icono"><IconoPublico nombre="bus" tamano={24} /></span><span className="cp-info-ruta"><strong>{micro.placa}</strong><span className={`cp-estado cp-estado-micro${micro.estado === 'disponible' ? ' cp-disponible' : ''}`}><IconoPublico nombre="comprobar" tamano={16} />{micro.estado === 'en_recorrido' ? 'En recorrido' : 'Disponible'}</span><UbicacionMicro micro={micro} /></span><span className="cp-ver-detalle">Ver detalle <IconoPublico nombre="siguiente" tamano={16} /></span>
      </button></li>)}</ul> : <EstadoVacio titulo="Sin micros activos en esta ruta" texto="La ruta está publicada, pero no hay unidades activas reportadas por el servicio. Puedes actualizar o elegir otra ruta." />}
      <Paginacion pagina={lectura.datos.pagina} ultima={lectura.datos.ultima} nombre="micros" alCambiar={nueva => { establecerSeleccionado(null); establecerPagina(nueva); }} />
    </>}

  </section></>}
  </section>;
}

function UbicacionMicro({ micro }: { micro: MicroPublico }) {
  return <span className="cp-ubicacion-micro"><IconoPublico nombre="ubicacion" tamano={16} />{micro.posicion
    ? <span>Posición registrada: <time dateTime={micro.posicion.fecha}>{textoFechaPosicion(micro.posicion)} (hora de Perú)</time></span>
    : 'Ubicación no disponible'}</span>;
}

function DetalleMicro({ id, ruta, alCerrar }: { id: number; ruta: RutaPublica; alCerrar: () => void }) {
  const [revision, establecerRevision] = useState(0);
  const cargar = useCallback((signal: AbortSignal) => consulta.micro(id, ruta.id, signal), [id, ruta.id]);
  const lectura = useLecturaPublica(`${id}-${ruta.id}-${revision}`, cargar);
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titulo.current?.focus(); titulo.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); }, []);
  return <section className="cp-ficha-micro" aria-labelledby="detalle-micro-titulo">
    <div className="cp-titulo-panel"><h3 id="detalle-micro-titulo" ref={titulo} tabIndex={-1}>Detalle del micro</h3><button type="button" className="cp-boton-icono" aria-label="Cerrar detalle del micro" onClick={alCerrar}><IconoPublico nombre="cerrar" tamano={20} /></button></div>
    {lectura.cargando ? <Cargando texto="Consultando la unidad seleccionada…" /> : lectura.error ? <ErrorConsulta mensaje={lectura.error} reintentar={() => establecerRevision(actual => actual + 1)} /> : lectura.datos && <>
      <div className="cp-placa"><IconoPublico nombre="bus" tamano={32} /><strong>{lectura.datos.placa}</strong></div>
      <UbicacionMicro micro={lectura.datos} />
      <dl><div><dt>Ruta</dt><dd>{ruta.nombre}</dd></div><div><dt>Empresa</dt><dd>{lectura.datos.empresa}</dd></div><div><dt>Estado reportado</dt><dd>{lectura.datos.estado === 'en_recorrido' ? 'En recorrido' : 'Disponible'}</dd></div><div><dt>Capacidad de la unidad</dt><dd>{lectura.datos.capacidad === null ? 'Sin información' : `${lectura.datos.capacidad} pasajeros`}</dd></div></dl>
      <p className="cp-ayuda">La capacidad es el máximo de pasajeros de la unidad; no indica cuántas personas van a bordo. Esta consulta no incluye seguimiento en vivo.</p>
    </>}
  </section>;
}

function Cargando({ texto }: { texto: string }) { return <div className="cp-cargando" role="status"><span aria-hidden="true" />{texto}</div>; }
function EstadoVacio({ titulo, texto }: { titulo: string; texto: string }) { return <div className="cp-vacio"><IconoPublico nombre="bus" tamano={32} /><h4>{titulo}</h4><p>{texto}</p></div>; }
function ErrorConsulta({ mensaje, reintentar }: { mensaje: string; reintentar: () => void }) { return <div className="cp-error"><IconoPublico nombre="advertencia" tamano={20} /><p role="alert">{mensaje}</p><button className="cp-boton cp-secundario" type="button" onClick={reintentar}><IconoPublico nombre="actualizar" tamano={16} />Reintentar</button></div>; }
function Paginacion({ pagina, ultima, nombre, alCambiar }: { pagina: number; ultima: number; nombre: string; alCambiar: (pagina: number) => void }) {
  if (ultima <= 1) return null;
  return <nav className="cp-paginacion" aria-label={`Páginas de ${nombre}`}><button type="button" className="cp-boton cp-secundario" disabled={pagina <= 1} onClick={() => alCambiar(pagina - 1)} aria-label={`Página anterior de ${nombre}`}><IconoPublico nombre="anterior" tamano={16} /></button><span>Página {pagina} de {ultima}</span><button type="button" className="cp-boton cp-secundario" disabled={pagina >= ultima} onClick={() => alCambiar(pagina + 1)} aria-label={`Página siguiente de ${nombre}`}><IconoPublico nombre="avanzar" tamano={16} /></button></nav>;
}
