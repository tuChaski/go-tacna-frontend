import { IconoPublico } from '../../publico/IconoPublico';
import type { DatosInicio } from '../datos/tipos-inicio';
import { MockupApp } from './MockupApp';

export function Hero({ datos }: { datos: DatosInicio }) {
  return <section className="gt-hero"><div className="gt-contenedor gt-hero-interior">
    <div><span className="gt-kicker">Transporte público · Tacna, Perú</span>
      <h1>Muévete por Tacna.<span>Encuentra tu ruta y conoce su recorrido.</span></h1>
      <p className="gt-texto">Consulta las rutas de transporte público y sus micros activos, sin necesidad de crear una cuenta.</p>
      <a className="gt-boton" href="/mapa">Consultar rutas</a>
      <p className="gt-confianza"><IconoPublico nombre="privacidad" tamano={16} />Consulta libre, sin compartir tu ubicación.</p>
    </div><MockupApp rutas={datos.rutas} />
  </div></section>;
}
