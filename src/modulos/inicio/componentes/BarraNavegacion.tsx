import { useEffect, useState } from 'react';
import { ArrowRight, BusFront, Menu, X } from 'lucide-react';

const ENLACES = [
  { href: '#caracteristicas', etiqueta: 'Características' },
  { href: '#rutas', etiqueta: 'Rutas' },
  { href: '#empresas', etiqueta: 'Para empresas' },
];

export function BarraNavegacion() {
  const [abierto, establecerAbierto] = useState(false);
  const [desplazado, establecerDesplazado] = useState(false);

  useEffect(() => {
    const alDesplazar = () => establecerDesplazado(window.scrollY > 24);
    alDesplazar();
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => window.removeEventListener('scroll', alDesplazar);
  }, []);

  useEffect(() => {
    const alPresionarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') establecerAbierto(false);
    };
    window.addEventListener('keydown', alPresionarTecla);
    return () => window.removeEventListener('keydown', alPresionarTecla);
  }, []);

  const cerrar = () => establecerAbierto(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        desplazado
          ? 'border-b border-slate-200 bg-white/90 text-slate-900 shadow-sm shadow-slate-900/5 backdrop-blur-xl'
          : 'bg-transparent text-white'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <a className="inline-flex items-center gap-2.5" href="#inicio" onClick={cerrar}>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1d63ed] text-white shadow-lg shadow-blue-950/20">
            <BusFront size={22} aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-lg font-extrabold tracking-tight">Go Tacna</span>
            <span className={`mt-1 text-[10px] font-medium uppercase tracking-[0.22em] ${desplazado ? 'text-slate-500' : 'text-blue-200/75'}`}>
              Movilidad urbana
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación principal">
          {ENLACES.map(enlace => (
            <a
              key={enlace.href}
              href={enlace.href}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                desplazado
                  ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  : 'text-blue-100/85 hover:bg-white/10 hover:text-white'
              }`}
            >
              {enlace.etiqueta}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <a
            href="/login"
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              desplazado
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                : 'text-blue-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            Iniciar sesión
          </a>
          <a
            href="#rutas"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1d63ed] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
          >
            Ver rutas
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>

        <button
          type="button"
          className={`grid h-11 w-11 place-items-center rounded-xl border transition md:hidden ${
            desplazado
              ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              : 'border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/15'
          }`}
          aria-expanded={abierto}
          aria-controls="menu-movil"
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => establecerAbierto(actual => !actual)}
        >
          {abierto ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      {abierto && (
        <nav
          id="menu-movil"
          aria-label="Navegación móvil"
          className={`border-t px-5 pb-6 pt-4 backdrop-blur-xl md:hidden ${
            desplazado ? 'border-slate-200 bg-white/95' : 'border-white/10 bg-[#081b3d]/95'
          }`}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {ENLACES.map(enlace => (
              <a
                key={enlace.href}
                href={enlace.href}
                onClick={cerrar}
                className={`flex min-h-12 items-center rounded-xl px-4 text-sm font-medium transition ${
                  desplazado
                    ? 'text-slate-700 hover:bg-slate-100'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                {enlace.etiqueta}
              </a>
            ))}
            <a
              href="/login"
              onClick={cerrar}
              className={`flex min-h-12 items-center rounded-xl px-4 text-sm font-semibold transition ${
                desplazado ? 'text-slate-900 hover:bg-slate-100' : 'text-white hover:bg-white/10'
              }`}
            >
              Iniciar sesión
            </a>
            <a
              href="#rutas"
              onClick={cerrar}
              className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1d63ed] px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Ver rutas
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
