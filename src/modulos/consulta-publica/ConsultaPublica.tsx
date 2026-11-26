import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, ArrowRight, BusFront, CheckCircle2, ChevronRight, CircleAlert, MapPin, RefreshCw, Route, Search, ShieldCheck, X } from 'lucide-react';
import { apiPublica } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { enlaceCuenta, etiquetaCuenta } from '../autenticacion/enlaces-sesion';
import { MapaBusesRespaldo } from '../inicio/componentes/MapaBusesRespaldo';
import type { RutaInicio } from '../inicio/datos/tipos-inicio';
import type { RutaPublica } from './contrato-publico';
import { crearConsultaPublica } from './servicio-consulta';
import { useLecturaPublica } from './useLecturaPublica';
import '@fontsource-variable/inter';
import './consulta-publica.css';

const consulta = crearConsultaPublica(apiPublica);

/** La selección es única y local. El catálogo no comparte el recorte ni los
 * ejemplos de la landing: todos los resultados se confirman con la API. */
export function ConsultaPublica() {
  const { user, isLoading } = useAuth();
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
  function buscar(evento: FormEvent) {
    evento.preventDefault();
    const busqueda = texto.trim();
    establecerFiltro(actual => actual.busqueda === busqueda && actual.pagina === 1 ? actual : { ...actual, busqueda, pagina: 1 });
  }
  function limpiar() { establecerTexto(''); establecerFiltro(actual => ({ ...actual, busqueda: '', pagina: 1 })); }
  function cerrarRuta() {
    const id = ruta?.id;
    // El botón sigue montado: devolver el foco antes de retirar el panel evita
    // depender de un frame futuro, que puede pausarse en pestañas de fondo.
    (document.getElementById(`ruta-publica-${id}`) ?? document.getElementById('buscar-ruta-publica'))?.focus();
    establecerRuta(null);
  }
  return <div className="consulta-publica">
    <a className="cp-saltar" href="#consulta-contenido">Saltar a la consulta</a>
    <header className="cp-cabecera"><div className="cp-ancho cp-barra">
      <a className="cp-marca" href="/"><span className="cp-logo"><BusFront size={23} aria-hidden="true" /></span><span>Go Tacna<small>MUÉVETE POR TU CIUDAD</small></span></a>
      <nav aria-label="Navegación pública"><a href="/">Inicio</a><a className="cp-nav-activo" href="/mapa" aria-current="page">Rutas y micros</a><a className="cp-cuenta" href={enlaceCuenta(user)}>{isLoading ? 'Cuenta' : etiquetaCuenta(user)}</a></nav>
    </div></header>
    <main id="consulta-contenido" className="cp-ancho">
      <section className="cp-presentacion" aria-labelledby="consulta-titulo"><div>
        <span className="cp-eyebrow"><MapPin size={15} aria-hidden="true" /> TACNA, PERÚ</span>
        <h1 id="consulta-titulo">Encuentra tu ruta.<br /><span>Sigue con tu día.</span></h1>
        <p>Consulta las rutas de tu ciudad y sus micros activos. Elige una ruta para empezar.</p>
        <div className="cp-beneficios"><span><ShieldCheck size={16} aria-hidden="true" /> Sin crear una cuenta</span><span><CheckCircle2 size={16} aria-hidden="true" /> Información pública</span></div>
      </div><ol className="cp-pasos" aria-label="Cómo consultar"><li><span>01</span>Elige tu ruta</li><li><span>02</span>Consulta sus micros</li><li><span>03</span>Revisa el detalle</li></ol></section>
      <div className="cp-columnas">
        <section className="cp-panel cp-directorio" aria-labelledby="rutas-titulo">
          <div className="cp-titulo-panel"><div><span className="cp-eyebrow">TU PUNTO DE PARTIDA</span><h2 id="rutas-titulo">Busca tu ruta</h2></div><span className="cp-icono"><Route size={23} aria-hidden="true" /></span></div>
          <form className="cp-buscador" onSubmit={buscar} role="search" aria-label="Buscar rutas de Tacna">
            <label htmlFor="buscar-ruta-publica">Nombre de la ruta</label><div className="cp-campo-busqueda"><Search size={19} aria-hidden="true" /><input id="buscar-ruta-publica" type="search" maxLength={180} placeholder="Ej.: Ruta 14 o Centro" value={texto} onChange={evento => establecerTexto(evento.target.value)} /></div>
            <div className="cp-botones-busqueda"><button className="cp-boton" type="submit">Buscar ruta <ArrowRight size={16} aria-hidden="true" /></button><button className="cp-boton cp-secundario" type="button" onClick={limpiar} disabled={!texto && !filtro.busqueda}>Ver todas</button></div>
          </form>
          <div className="cp-separador"><h3>Rutas disponibles</h3><button className="cp-texto-boton" type="button" disabled={lectura.cargando} onClick={() => establecerFiltro(actual => ({ ...actual, revision: actual.revision + 1 }))}><RefreshCw size={14} aria-hidden="true" />Actualizar rutas</button></div>
          {lectura.cargando ? <Cargando texto="Consultando rutas…" /> : lectura.error ? <ErrorConsulta mensaje={lectura.error} reintentar={() => establecerFiltro(actual => ({ ...actual, pagina: 1, revision: actual.revision + 1 }))} /> : lectura.datos && <>
            <p className="cp-resultados" role="status">{lectura.datos.total} {lectura.datos.total === 1 ? 'ruta encontrada' : 'rutas encontradas'}{filtro.busqueda ? ` para «${filtro.busqueda}»` : ' en el catálogo'}</p>
            {lectura.datos.registros.length ? <ul className="cp-lista-rutas">{lectura.datos.registros.map(item => <li key={item.id}><button type="button" id={`ruta-publica-${item.id}`} className={`cp-tarjeta-ruta${ruta?.id === item.id ? ' cp-seleccionada' : ''}`} aria-pressed={ruta?.id === item.id} onClick={() => establecerRuta(item)}>
              <span className="cp-icono"><Route size={23} aria-hidden="true" /></span><span className="cp-info-ruta"><strong>{item.nombre}</strong><span>{item.empresa}</span><span className="cp-estado"><CheckCircle2 size={13} aria-hidden="true" />{ruta?.id === item.id ? 'Ruta seleccionada' : 'Ruta activa'}</span></span><ChevronRight size={19} aria-hidden="true" />
            </button></li>)}</ul> : <EstadoVacio titulo={filtro.busqueda ? 'No encontramos esa ruta' : 'Aún no hay rutas publicadas'} texto={filtro.busqueda ? 'Prueba con otro nombre o vuelve a ver todas las rutas.' : 'Vuelve a consultar más adelante.'} />}
            <Paginacion pagina={lectura.datos.pagina} ultima={lectura.datos.ultima} nombre="rutas" alCambiar={pagina => establecerFiltro(actual => ({ ...actual, pagina }))} />
          </>}
        </section>
        <div className="cp-consulta-ruta">{ruta ? <PanelRuta key={ruta.id} rutaId={ruta.id} alCerrar={cerrarRuta} /> : <section className="cp-panel cp-bienvenida" aria-labelledby="seleccion-titulo"><div className="cp-ilustracion"><Route size={70} strokeWidth={1.3} aria-hidden="true" /><span><BusFront size={28} aria-hidden="true" /></span></div><span className="cp-eyebrow">CADA VIAJE EMPIEZA CON UNA RUTA</span><h2 id="seleccion-titulo">¿Por dónde vas hoy?</h2><p>Elige una ruta del catálogo para ver su recorrido registrado y consultar sus unidades activas.</p><div className="cp-aviso"><ShieldCheck size={19} aria-hidden="true" /><p>Puedes consultar como invitado. No necesitas iniciar sesión.</p></div></section>}</div>
      </div>
      <footer className="cp-pie"><span>Go Tacna · Rutas que conectan tu ciudad</span><p>Consulta de catálogo. El seguimiento en vivo se incorporará en otra etapa.</p></footer>
    </main>
  </div>;
}

function PanelRuta({ rutaId, alCerrar }: { rutaId: number; alCerrar: () => void }) {
  const [revision, establecerRevision] = useState(0);
  const cargar = useCallback((signal: AbortSignal) => consulta.ruta(rutaId, signal), [rutaId]);
  const lectura = useLecturaPublica(`${rutaId}-${revision}`, cargar);
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titulo.current?.focus(); titulo.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); }, []);
  return <section className="cp-panel cp-ruta-detalle" aria-labelledby="ruta-seleccionada-titulo">
    <div className="cp-titulo-panel"><div><span className="cp-eyebrow">TU RUTA SELECCIONADA</span><h2 ref={titulo} tabIndex={-1} id="ruta-seleccionada-titulo">{lectura.datos?.nombre ?? 'Consultar ruta'}</h2></div><button className="cp-boton-icono" type="button" aria-label="Cerrar ruta seleccionada" onClick={alCerrar}><X size={20} aria-hidden="true" /></button></div>
    {lectura.cargando ? <Cargando texto="Consultando el detalle de la ruta…" /> : lectura.error ? <ErrorConsulta mensaje={lectura.error} reintentar={() => establecerRevision(actual => actual + 1)} /> : lectura.datos && <><p className="cp-empresa"><BusFront size={16} aria-hidden="true" />{lectura.datos.empresa}</p><Recorrido ruta={lectura.datos} /><UnidadesRuta ruta={lectura.datos} /></>}
  </section>;
}

function Recorrido({ ruta }: { ruta: RutaPublica }) {
  // Solo dibujamos la geometría registrada con el componente existente. El mapa
  // interactivo completo corresponde a T058; no simulamos ubicaciones de buses.
  const rutas: RutaInicio[] = [{ ...ruta, activa: true, color: '#60a5fa' }];
  return <figure className="cp-recorrido">{ruta.coordenadas.length >= 2 ? <div className="cp-mapa"><MapaBusesRespaldo rutas={rutas} etiqueta="Esquema del recorrido" /><span><MapPin size={14} aria-hidden="true" /> Recorrido registrado</span></div> : <div className="cp-sin-trazado"><MapPin size={25} aria-hidden="true" /><p>Esta ruta aún no tiene un trazado publicado.</p></div>}<figcaption>Esquema del recorrido · No representa ubicaciones actuales de los micros.</figcaption></figure>;
}

function UnidadesRuta({ ruta }: { ruta: RutaPublica }) {
  const [pagina, establecerPagina] = useState(1);
  const [revision, establecerRevision] = useState(0);
  const [seleccionado, establecerSeleccionado] = useState<number | null>(null);
  const cargar = useCallback((signal: AbortSignal) => consulta.micros(ruta.id, pagina, signal), [ruta.id, pagina]);
  const lectura = useLecturaPublica(`${ruta.id}-${pagina}-${revision}`, cargar);
  function cerrarDetalle() {
    const id = seleccionado;
    (document.getElementById(`micro-publico-${id}`) ?? document.getElementById('unidades-titulo'))?.focus();
    establecerSeleccionado(null);
  }
  return <section className="cp-unidades" aria-labelledby="unidades-titulo">
    <div className="cp-separador"><h3 id="unidades-titulo" tabIndex={-1}>Micros activos</h3><button className="cp-texto-boton" type="button" disabled={lectura.cargando} onClick={() => establecerRevision(actual => actual + 1)}><RefreshCw size={14} aria-hidden="true" />Actualizar micros</button></div>
    <p className="cp-ayuda">Incluye unidades disponibles y en recorrido. El estado no indica cercanía ni tiempo de llegada.</p>
    {lectura.cargando ? <Cargando texto="Consultando micros de esta ruta…" /> : lectura.error ? <ErrorConsulta mensaje={lectura.error} reintentar={() => { establecerPagina(1); establecerRevision(actual => actual + 1); }} /> : lectura.datos && <>
      <p className="cp-resultados" role="status">{lectura.datos.total} {lectura.datos.total === 1 ? 'micro activo' : 'micros activos'}</p>
      {lectura.datos.registros.length ? <ul className="cp-lista-micros">{lectura.datos.registros.map(micro => <li key={micro.id}><button className={`cp-tarjeta-micro${seleccionado === micro.id ? ' cp-seleccionada' : ''}`} type="button" id={`micro-publico-${micro.id}`} onClick={() => establecerSeleccionado(micro.id)} aria-expanded={seleccionado === micro.id}>
        <span className="cp-icono"><BusFront size={24} aria-hidden="true" /></span><span className="cp-info-ruta"><strong>{micro.placa}</strong><span className={`cp-estado${micro.estado === 'disponible' ? ' cp-disponible' : ''}`}>{micro.estado === 'en_recorrido' ? 'En recorrido' : 'Disponible'}</span></span><span className="cp-ver-detalle">Ver detalle <ChevronRight size={17} aria-hidden="true" /></span>
      </button></li>)}</ul> : <EstadoVacio titulo="Sin micros activos en esta ruta" texto="La ruta está publicada, pero no hay unidades activas reportadas por el servicio. Puedes actualizar o elegir otra ruta." />}
      <Paginacion pagina={lectura.datos.pagina} ultima={lectura.datos.ultima} nombre="micros" alCambiar={establecerPagina} />
    </>}
    {seleccionado !== null && <DetalleMicro key={`${seleccionado}-${revision}`} id={seleccionado} ruta={ruta} alCerrar={cerrarDetalle} />}
  </section>;
}

function DetalleMicro({ id, ruta, alCerrar }: { id: number; ruta: RutaPublica; alCerrar: () => void }) {
  const [revision, establecerRevision] = useState(0);
  const cargar = useCallback((signal: AbortSignal) => consulta.micro(id, ruta.id, signal), [id, ruta.id]);
  const lectura = useLecturaPublica(`${id}-${ruta.id}-${revision}`, cargar);
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titulo.current?.focus(); titulo.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); }, []);
  return <section className="cp-ficha-micro" aria-labelledby="detalle-micro-titulo">
    <div className="cp-titulo-panel"><h3 id="detalle-micro-titulo" ref={titulo} tabIndex={-1}>Detalle del micro</h3><button type="button" className="cp-boton-icono" aria-label="Cerrar detalle del micro" onClick={alCerrar}><X size={20} aria-hidden="true" /></button></div>
    {lectura.cargando ? <Cargando texto="Consultando la unidad seleccionada…" /> : lectura.error ? <ErrorConsulta mensaje={lectura.error} reintentar={() => establecerRevision(actual => actual + 1)} /> : lectura.datos && <>
      <div className="cp-placa"><BusFront size={29} aria-hidden="true" /><strong>{lectura.datos.placa}</strong></div>
      <dl><div><dt>Ruta</dt><dd>{ruta.nombre}</dd></div><div><dt>Empresa</dt><dd>{lectura.datos.empresa}</dd></div><div><dt>Estado reportado</dt><dd>{lectura.datos.estado === 'en_recorrido' ? 'En recorrido' : 'Disponible'}</dd></div><div><dt>Capacidad de la unidad</dt><dd>{lectura.datos.capacidad === null ? 'Sin información' : `${lectura.datos.capacidad} pasajeros`}</dd></div></dl>
      <p className="cp-ayuda">La capacidad es el máximo de pasajeros de la unidad; no indica cuántas personas van a bordo. Esta consulta no incluye seguimiento en vivo.</p>
    </>}
  </section>;
}

function Cargando({ texto }: { texto: string }) { return <div className="cp-cargando" role="status"><span aria-hidden="true" />{texto}</div>; }
function EstadoVacio({ titulo, texto }: { titulo: string; texto: string }) { return <div className="cp-vacio"><BusFront size={29} aria-hidden="true" /><h4>{titulo}</h4><p>{texto}</p></div>; }
function ErrorConsulta({ mensaje, reintentar }: { mensaje: string; reintentar: () => void }) { return <div className="cp-error"><CircleAlert size={23} aria-hidden="true" /><p role="alert">{mensaje}</p><button className="cp-boton cp-secundario" type="button" onClick={reintentar}><RefreshCw size={15} aria-hidden="true" />Reintentar</button></div>; }
function Paginacion({ pagina, ultima, nombre, alCambiar }: { pagina: number; ultima: number; nombre: string; alCambiar: (pagina: number) => void }) {
  if (ultima <= 1) return null;
  return <nav className="cp-paginacion" aria-label={`Páginas de ${nombre}`}><button type="button" className="cp-boton cp-secundario" disabled={pagina <= 1} onClick={() => alCambiar(pagina - 1)} aria-label={`Página anterior de ${nombre}`}><ArrowLeft size={17} aria-hidden="true" /></button><span>Página {pagina} de {ultima}</span><button type="button" className="cp-boton cp-secundario" disabled={pagina >= ultima} onClick={() => alCambiar(pagina + 1)} aria-label={`Página siguiente de ${nombre}`}><ArrowRight size={17} aria-hidden="true" /></button></nav>;
}
