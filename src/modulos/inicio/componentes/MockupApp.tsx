import { lazy, Suspense, useMemo } from 'react';
import { ArrowRight, BusFront, Clock3, MapPin, Radio } from 'lucide-react';
import type { MicroInicio, RutaInicio } from '../datos/tipos-inicio';

const MapaBuses3D = lazy(() => import('./MapaBuses3D').then(modulo => ({ default: modulo.MapaBuses3D })));

interface Props {
  rutas: readonly RutaInicio[];
  micros: readonly MicroInicio[];
  cargando: boolean;
  esRespaldo: boolean;
}

const ETAS = ['3 min', '6 min'];

export function MockupApp({ rutas, micros, cargando, esRespaldo }: Props) {
  const rutasVisibles = useMemo(() => rutas.slice(0, 2), [rutas]);

  return (
    <div id="mapa-vivo" className="relative mx-auto w-full max-w-[460px] scroll-mt-28 lg:max-w-none">
      {(micros.length > 0 || esRespaldo) && (
        <div className="absolute -left-5 bottom-24 z-10 hidden w-44 animate-flotar rounded-xl border border-white/20 bg-white/95 p-3 shadow-xl shadow-blue-950/25 backdrop-blur sm:block">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-[#1d63ed]">
              <BusFront size={16} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold text-slate-900">{micros[0]?.placa ?? 'V1A-101'}</p>
              <p className="text-[10px] text-slate-500">Unidad en ruta</p>
            </div>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#1d63ed]">
            <Clock3 size={13} aria-hidden="true" />
            Llegada aprox. 3 min
          </p>
        </div>
      )}

      {(micros.length > 0 || esRespaldo) && (
        <div className="absolute -right-3 top-24 z-10 hidden animate-pulso-suave items-center gap-2 rounded-full border border-white/20 bg-[#081b3d]/85 px-3 py-1.5 text-[10px] font-semibold text-blue-100 shadow-lg backdrop-blur lg:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Vista 3D
        </div>
      )}

      <div className="relative rounded-2xl border border-white/20 bg-white/95 p-2.5 shadow-2xl shadow-blue-950/40 backdrop-blur">
        <div className="overflow-hidden rounded-[1.15rem] bg-[#081b3d]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#1d63ed] text-white">
                <BusFront size={17} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold leading-none text-white">Go Tacna</p>
                <p className="mt-1 text-[10px] leading-none text-blue-200/70">Rutas de Tacna</p>
              </div>
            </div>
            <span className="rounded-full border border-blue-300/20 bg-blue-400/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-blue-200">
              Vista demostrativa
            </span>
          </div>

          <div className="relative h-[300px] overflow-hidden sm:h-[340px]">
            {cargando ? (
              <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_45%,rgba(29,99,237,0.3),transparent_68%)]">
                <p className="text-xs font-medium text-blue-200/80" role="status">Cargando mapa 3D…</p>
              </div>
            ) : (
              <Suspense
                fallback={(
                  <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_45%,rgba(29,99,237,0.3),transparent_68%)]">
                    <p className="text-xs font-medium text-blue-200/80">Cargando mapa 3D…</p>
                  </div>
                )}
              >
                <MapaBuses3D rutas={rutasVisibles} micros={micros} mostrarBusesDemo={esRespaldo} />
              </Suspense>
            )}

            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#081b3d]/75 px-2.5 py-1.5 text-[10px] font-medium text-blue-100 backdrop-blur">
                <MapPin size={12} aria-hidden="true" />
                Tacna, Perú
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#081b3d]/75 px-2.5 py-1.5 text-[10px] font-medium text-blue-100 backdrop-blur">
                <Radio size={12} className="text-emerald-400" aria-hidden="true" />
                Demo 3D
              </span>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#081b3d] to-transparent" />
          </div>

          <div className="bg-white px-4 pb-4 pt-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-900">Próximos micros</p>
              <a
                href="#rutas"
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#1d63ed] hover:text-blue-700"
              >
                Ver rutas
                <ArrowRight size={12} aria-hidden="true" />
              </a>
            </div>

            <div className="grid gap-2">
              {cargando ? (
                <>
                  <div className="h-[58px] animate-pulse rounded-xl bg-slate-100" />
                  <div className="h-[58px] animate-pulse rounded-xl bg-slate-100" />
                </>
              ) : (
                rutasVisibles.map((ruta, indice) => {
                  const micro = micros.find(item => item.rutaId === ruta.id);
                  return (
                    <div
                      key={ruta.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#1d63ed]">
                        <BusFront size={18} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-900">{ruta.nombre}</p>
                        <p className="truncate text-[10px] text-slate-500">
                          {micro?.placa ?? (esRespaldo ? 'Unidad demo' : 'Sin unidad')} · {ruta.empresa}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-bold text-[#1d63ed]">{ETAS[indice] ?? '8 min'}</p>
                        <p className="text-[9px] text-slate-400">aprox.</p>
                      </div>
                    </div>
                  );
                })
              )}

              {!cargando && rutasVisibles.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-[11px] text-slate-500">
                  No hay rutas disponibles por el momento.
                </p>
              )}
            </div>

            {esRespaldo && !cargando && (
              <p className="mt-3 text-center text-[9px] font-medium text-slate-400">
                Datos de demostración · la API no está disponible
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
