import { useAuth } from '../../../hooks/useAuth';
import { enlaceCuenta, etiquetaCuenta } from '../../autenticacion/enlaces-sesion';
export function PiePagina() {
  const { user } = useAuth();
  return <footer className="gt-pie"><div className="gt-contenedor gt-pie-grid">
    <div><a className="gt-marca" href="/#inicio">Go Tacna</a><p>Rutas y unidades de tu ciudad.</p><small>© {new Date().getFullYear()} Go Tacna · Tacna, Perú</small></div>
    <nav aria-label="Enlaces del producto"><strong>Explora</strong><a href="/#inicio">Inicio</a><a href="/#rutas">Rutas</a><a href="/mapa">Consultar rutas</a><a href="/#empresas">Para empresas</a></nav>
    <nav aria-label="Enlaces de cuenta"><strong>Tu cuenta</strong><a href={enlaceCuenta(user)}>{etiquetaCuenta(user)}</a>{!user && <a href="/registro">Crear cuenta de pasajero</a>}</nav>
  </div></footer>;
}
