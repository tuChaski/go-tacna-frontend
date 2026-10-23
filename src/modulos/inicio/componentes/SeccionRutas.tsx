import { ArrowRight, BusFront, MapPin, Route } from 'lucide-react';
import type { MicroInicio, RutaInicio } from '../datos/tipos-inicio';
import { TrazadoRutaSvg } from './TrazadoRutaSvg';

interface Props {
  rutas: readonly RutaInicio[];
  micros: readonly MicroInicio[];
  cargando: boolean;
  esRespaldo: boolean;
}

function TarjetaRuta({ ruta, micros, indice, esRespaldo }: { ruta: RutaInicio; micros: readonly MicroInicio[]; indice: number; esRespaldo: boolean }) {
  const unidades = micros.filter(micro => micro.rutaId === ruta.id).length;

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5">
      <div className="grid sm:grid-cols-[1fr_180px]">
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-[#1d63ed]">
              <Route size={12} aria-hidden="true" />
              Ruta {String(indice + 1).padStart(2, '0')}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
              <span className={`h-1.5 w-1.5 rounded-full ${ruta.activa ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              {ruta.activa ? 'Activa' : 'Inactiva'}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-bold tracking-tight text-slate-900">{ruta.nombre}</h3>
          <p className="mt-1 text-xs text-slate-500">{ruta.empresa}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <BusFront size={13} className="text-[#1d63ed]" aria-hidden="true" />
              {unidades > 0
                ? `${unidades} ${unidades === 1 ? 'unidad' : 'unidades'}`
                : esRespaldo
                  ? 'Unidad demo'
                  : 'Sin unidades reportadas'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} className="text-[#1d63ed]" aria-hidden="true" />
              {ruta.coordenadas.length} puntos de recorrido
            </span>
          </div>

          <a
            href="#mapa-vivo"
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1d63ed] transition hover:gap-2.5 hover:text-blue-700"
          >
            Ver recorrido
            <ArrowRight size={14} aria-hidden="true" />
          </a>
        </div>

        <div className="relative min-h-[160px] border-t border-slate-100 bg-blue-50/50 p-3 sm:border-l sm:border-t-0">
          <TrazadoRutaSvg ruta={ruta} className="h-full w-full rounded-lg" />
        </div>
      </div>
    </article>
  );
}

export function SeccionRutas({ rutas, micros, cargando, esRespaldo }: Props) {
  return (
    <section id="rutas" className="scroll-mt-24 border-y border-slate-200 bg-gray-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1d63ed]">
              Rutas de la ciudad
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] text-slate-900 sm:text-4xl">
              Recorridos reales, lectura simple
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Explora los trazados registrados en Go Tacna y ubica cada unidad sobre su recorrido.
              La animación del mapa es una vista demostrativa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {esRespaldo && !cargando && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-semibold text-amber-700">
                Datos de demostración
              </span>
            )}
            <a
              href="#mapa-vivo"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-[#1d63ed]"
            >
              <MapPin size={15} aria-hidden="true" />
              Abrir mapa 3D
            </a>
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {cargando ? (
            <>
              <div className="h-[238px] animate-pulse rounded-xl border border-slate-200 bg-white" />
              <div className="h-[238px] animate-pulse rounded-xl border border-slate-200 bg-white" />
            </>
          ) : rutas.length > 0 ? (
            rutas.map((ruta, indice) => (
              <TarjetaRuta key={ruta.id} ruta={ruta} micros={micros} indice={indice} esRespaldo={esRespaldo} />
            ))
          ) : (
            <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 lg:col-span-2">
              No hay rutas disponibles por el momento.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
