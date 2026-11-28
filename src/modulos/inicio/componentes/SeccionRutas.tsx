import { useState } from 'react';
import { IconoPublico } from '../../publico/IconoPublico';
import type { RutaInicio } from '../datos/tipos-inicio';
import { TrazadoRutaSvg } from './TrazadoRutaSvg';

interface Props { rutas: readonly RutaInicio[]; cargando: boolean; error?: string; total: number; reintentar: () => void }
export function SeccionRutas({ rutas, cargando, error, total, reintentar }: Props) {
  const [seleccion, establecerSeleccion] = useState<number | null>(null);
  const ruta = rutas.find(r => r.id === seleccion);
  return <section id="rutas" className="gt-rutas"><div className="gt-contenedor">
    <div className="gt-seccion-cabecera"><div><span className="gt-kicker">Rutas de tu ciudad</span><h2>Explora las rutas de Tacna</h2><p className="gt-texto">Selecciona una ruta para conocer su recorrido y consultar sus micros.</p></div><a className="gt-boton gt-boton-secundario" href="/mapa">Consultar todas las rutas</a></div>
    {cargando ? <p role="status" className="gt-vacio">Consultando rutas publicadas…</p> : error ? <div className="gt-error"><p role="alert">{error}</p><button className="gt-boton gt-boton-secundario" onClick={reintentar}>Reintentar catálogo</button></div> : !rutas.length ? <p className="gt-vacio">Todavía no hay rutas publicadas.</p> : <>
      <div className="gt-rutas-grid">{rutas.map(r => <button type="button" className="gt-ruta-boton" key={r.id} id={`inicio-ruta-${r.id}`} aria-expanded={r.id === seleccion} aria-controls="inicio-detalle-ruta" onClick={() => establecerSeleccion(actual => actual === r.id ? null : r.id)}>
        <span className="gt-ruta-nombre"><span className="gt-color-ruta" style={{background:r.color}} aria-hidden="true" />{r.nombre}</span><IconoPublico nombre="desplegar" tamano={20} /></button>)}</div>
      {ruta && <section className="gt-ruta-expandida" id="inicio-detalle-ruta" aria-label={`Detalle de ${ruta.nombre}`}>
        <div><h3>{ruta.nombre}</h3><p>{ruta.empresa}</p><p>Ruta activa · Consulta las unidades reportadas por la empresa.</p><a className="gt-boton" href={`/mapa?ruta=${ruta.id}`}>Ver recorrido en el mapa</a></div>
        <figure>{ruta.coordenadas.length >= 2 ? <TrazadoRutaSvg ruta={ruta} className="gt-mini-recorrido" /> : <div className="gt-vacio"><IconoPublico nombre="ruta" tamano={20} />Sin trazado publicado</div>}<figcaption>Esquema del recorrido registrado. No representa la posición de los micros.</figcaption></figure>
      </section>}
      {total > rutas.length && <p className="gt-confianza">Mostramos {rutas.length} de {total} rutas. Consulta el catálogo completo en el mapa.</p>}
    </>}
  </div></section>;
}
