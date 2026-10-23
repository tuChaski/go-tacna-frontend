import { useState } from 'react';
import { BusFront, Download, MapPin, Radio, ShieldCheck } from 'lucide-react';
import type { DatosInicio } from '../datos/tipos-inicio';
import { MockupApp } from './MockupApp';

interface Props {
  datos: DatosInicio;
}

const SENALES = [
  { icono: MapPin, texto: 'Trazados reales' },
  { icono: BusFront, texto: 'Unidades activas' },
  { icono: ShieldCheck, texto: 'Datos de tu ciudad' },
];

export function Hero({ datos }: Props) {
  const [avisoDescarga, establecerAvisoDescarga] = useState(false);

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#0e2d63] via-[#0a2350] to-[#081b3d] pb-16 pt-28 sm:pt-32 lg:pb-24 lg:pt-36">
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(147, 197, 253, 0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(147, 197, 253, 0.16) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
          maskImage: 'radial-gradient(ellipse at center, black, transparent 78%)',
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#1d63ed]/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-28 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-40 w-[46rem] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-100 backdrop-blur sm:text-[11px]">
              <Radio size={13} className="text-emerald-400" aria-hidden="true" />
              Tacna · movilidad urbana
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.06] tracking-[-0.035em] text-white sm:text-5xl lg:text-[3.6rem] xl:text-[4.05rem]">
              Tu pase para moverte por Tacna{' '}
              <span className="bg-gradient-to-r from-blue-300 to-cyan-200 bg-clip-text text-transparent">
                sin incertidumbre
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-blue-100/80 sm:text-lg sm:leading-8">
              Consulta las rutas registradas, explora las unidades activas y recorre la ciudad
              en una vista 3D referencial. Muévete por Tacna con información clara, desde tu celular.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/mapa"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1d63ed] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
              >
                <MapPin size={18} aria-hidden="true" />
                Abrir mapa 3D
              </a>
              <button
                type="button"
                onClick={() => establecerAvisoDescarga(actual => !actual)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
                aria-expanded={avisoDescarga}
                aria-controls="aviso-descarga"
              >
                <Download size={18} aria-hidden="true" />
                Descargar app
              </button>
            </div>

            <p
              id="aviso-descarga"
              role="status"
              aria-live="polite"
              className={avisoDescarga ? 'mt-3 max-w-lg text-xs leading-5 text-blue-200/80' : 'sr-only'}
            >
              {avisoDescarga
                ? 'La app móvil estará disponible próximamente. Mientras tanto, puedes usar el mapa desde el navegador.'
                : ''}
            </p>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-medium text-blue-100/70 sm:text-xs">
              {SENALES.map(({ icono: Icono, texto }) => (
                <li key={texto} className="inline-flex items-center gap-2">
                  <Icono size={14} className="text-blue-300" aria-hidden="true" />
                  {texto}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[500px] lg:max-w-none">
            <div className="pointer-events-none absolute -inset-8 rounded-[2.5rem] bg-blue-400/10 blur-2xl" />
            <MockupApp {...datos} />
          </div>
        </div>

        <dl className="mt-14 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 sm:grid-cols-4 sm:gap-4 lg:mt-20">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur">
            <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-blue-200/60">
              Rutas conectadas
            </dt>
            <dd className="mt-1 text-xl font-bold text-white">
              {datos.cargando ? '—' : datos.rutas.length}
            </dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur">
            <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-blue-200/60">
              Micros activos
            </dt>
            <dd className="mt-1 text-xl font-bold text-white">
              {datos.cargando ? '—' : datos.micros.length}
            </dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur">
            <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-blue-200/60">
              Visualización
            </dt>
            <dd className="mt-1 text-xl font-bold text-white">3D</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur">
            <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-blue-200/60">
              Cobertura
            </dt>
            <dd className="mt-1 text-xl font-bold text-white">Tacna</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
