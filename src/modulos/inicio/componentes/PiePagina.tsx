import { BusFront, MapPin } from 'lucide-react';

const ENLACES_PRODUCTO = [
  { href: '#caracteristicas', etiqueta: 'Características' },
  { href: '#rutas', etiqueta: 'Rutas' },
  { href: '#empresas', etiqueta: 'Para empresas' },
  { href: '#mapa-vivo', etiqueta: 'Mapa 3D' },
];

const ENLACES_CUENTA = [
  { href: '/login', etiqueta: 'Iniciar sesión' },
  { href: '/registro', etiqueta: 'Crear cuenta' },
  { href: '/login', etiqueta: 'Panel de empresa' },
];

export function PiePagina() {
  const anio = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#081b3d] text-blue-100/65">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <a className="inline-flex items-center gap-2.5" href="#inicio">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1d63ed] text-white">
                <BusFront size={22} aria-hidden="true" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-lg font-extrabold tracking-tight text-white">Go Tacna</span>
                <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-blue-200/60">
                  Movilidad urbana
                </span>
              </span>
            </a>
            <p className="mt-4 max-w-sm text-xs leading-6 text-blue-100/60">
              Información clara para moverte por Tacna: rutas, unidades activas y tiempos
              estimados de llegada en una sola plataforma.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-[11px] text-blue-200/60">
              <MapPin size={13} aria-hidden="true" />
              Tacna, Perú
            </p>
          </div>

          <nav aria-label="Enlaces del producto">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-200/70">
              Producto
            </h2>
            <ul className="mt-4 space-y-2.5">
              {ENLACES_PRODUCTO.map(enlace => (
                <li key={enlace.etiqueta}>
                  <a
                    href={enlace.href}
                    className="text-xs text-blue-100/60 transition hover:text-white"
                  >
                    {enlace.etiqueta}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Enlaces de cuenta">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-200/70">
              Cuenta
            </h2>
            <ul className="mt-4 space-y-2.5">
              {ENLACES_CUENTA.map(enlace => (
                <li key={enlace.etiqueta}>
                  <a
                    href={enlace.href}
                    className="text-xs text-blue-100/60 transition hover:text-white"
                  >
                    {enlace.etiqueta}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-white/10 pt-5">
          <p className="text-[10px] leading-5 text-blue-100/45">
            Vista demostrativa: la ubicación de los micros se simula sobre los trazados
            registrados. No sustituye la información oficial de cada empresa de transporte.
          </p>
          <div className="mt-4 flex flex-col gap-2 text-[10px] text-blue-100/40 sm:flex-row sm:items-center sm:justify-between">
            <p>© {anio} Go Tacna. Todos los derechos reservados.</p>
            <p>Hecho en Tacna, Perú.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
