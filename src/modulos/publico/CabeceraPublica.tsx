import { useEffect, useRef, useState } from 'react';
import { IconoPublico } from './IconoPublico';
import { useAuth } from '../../hooks/useAuth';
import { enlaceCuenta, etiquetaCuenta } from '../autenticacion/enlaces-sesion';
import '@fontsource-variable/inter';
import './publico.css';

export function CabeceraPublica({ mapa = false }: { mapa?: boolean }) {
  const { user, isLoading } = useAuth();
  const [abierto, establecerAbierto] = useState(false);
  const [seccion, establecerSeccion] = useState(() => window.location.hash || '#inicio');
  const disparador = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const tecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape' && abierto) { establecerAbierto(false); disparador.current?.focus(); }
    };
    const hash = () => establecerSeccion(window.location.hash || '#inicio');
    document.addEventListener('keydown', tecla); window.addEventListener('hashchange', hash);
    return () => { document.removeEventListener('keydown', tecla); window.removeEventListener('hashchange', hash); };
  }, [abierto]);
  function cerrar() { establecerAbierto(false); disparador.current?.focus(); }
  return <header className="gt-cabecera" onBlur={evento => {
    if (evento.relatedTarget && !evento.currentTarget.contains(evento.relatedTarget)) establecerAbierto(false);
  }}>
    <div className="gt-barra gt-contenedor">
      <a className="gt-marca" href="/#inicio" aria-label="Go Tacna, inicio"><span className="gt-logo"><IconoPublico nombre="bus" tamano={24} /></span><span>Go Tacna<small>Movilidad urbana</small></span></a>
      <nav className="gt-nav" aria-label="Navegación principal">{[['#inicio', 'Inicio'], ['#rutas', 'Rutas'], ['#empresas', 'Para empresas']].map(([href, texto]) => <a key={href} href={`/${href}`} aria-current={!mapa && seccion === href ? 'location' : undefined}>{texto}</a>)}</nav>
      <div className="gt-acceso"><a className="gt-acceso-cuenta" href={enlaceCuenta(user)}><IconoPublico nombre="pasajero" tamano={20} />{isLoading ? 'Cuenta' : etiquetaCuenta(user)}</a>{mapa ? <span className="gt-pagina-actual">Consulta de rutas</span> : <a className="gt-boton" href="/mapa">Consultar rutas</a>}</div>
      <button className="gt-menu" type="button" ref={disparador} aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={abierto} aria-controls="gt-menu-movil" onClick={() => establecerAbierto(actual => !actual)}>{abierto ? <IconoPublico nombre="cerrar" tamano={20} /> : <IconoPublico nombre="menu" tamano={20} />}</button>
    </div>
    {abierto && <nav className="gt-menu-movil gt-contenedor" id="gt-menu-movil" aria-label="Navegación móvil">
      <a href="/#inicio" onClick={cerrar}>Inicio</a><a href="/#rutas" onClick={cerrar}>Rutas</a><a href="/#empresas" onClick={cerrar}>Para empresas</a><a href={enlaceCuenta(user)} onClick={cerrar}>{isLoading ? 'Cuenta' : etiquetaCuenta(user)}</a><a href="/mapa" aria-current={mapa ? 'page' : undefined} onClick={cerrar}>Consultar rutas</a>
    </nav>}
  </header>;
}
