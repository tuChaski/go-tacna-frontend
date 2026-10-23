import { lazy, Suspense } from 'react';
import { ArrowLeft, BusFront, MapPin, Radio, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { enlaceCuenta, etiquetaCuenta } from '../autenticacion/enlaces-sesion';
import { useDatosInicio } from './datos/useDatosInicio';

const MapaBuses3D = lazy(() => import('./componentes/MapaBuses3D').then(modulo => ({ default: modulo.MapaBuses3D })));

/**
 * Página pública del mapa 3D. Reutiliza los datos y la escena de la landing,
 * pero sin prometer posiciones GPS que la API pública todavía no expone.
 */
export function MapaPublico() {
  const datos = useDatosInicio();
  const { user, isLoading } = useAuth();
  const etiqueta = isLoading ? 'Cuenta' : etiquetaCuenta(user);

  return (
    <div className="min-h-screen bg-[#081b3d] font-sans text-white">
      <header className="border-b border-white/10 bg-[#081b3d]/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <a className="inline-flex items-center gap-2.5" href="/" aria-label="Go Tacna, volver al inicio">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1d63ed] text-white shadow-lg shadow-blue-950/20">
              <BusFront size={22} aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-lg font-extrabold tracking-tight">Go Tacna</span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-blue-200/75">
                Mapa 3D
              </span>
            </span>
          </a>

          <nav className="flex items-center gap-1" aria-label="Navegación del mapa">
            <a
              href="/#rutas"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-medium text-blue-100/80 transition hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              Rutas
            </a>
            <a
              href={enlaceCuenta(user)}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {etiqueta}
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-10">
        <section
          className="relative min-h-[60svh] overflow-hidden rounded-2xl border border-white/10 bg-[#0a2350] shadow-2xl shadow-blue-950/30 lg:min-h-[calc(100svh-8.5rem)]"
          aria-label="Mapa 3D de las rutas de Tacna"
        >
          {datos.cargando ? (
            <div className="grid h-full min-h-[60svh] place-items-center px-6 text-center lg:min-h-[calc(100svh-8.5rem)]">
              <div>
                <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-blue-200/30 border-t-blue-300" />
                <p className="mt-4 text-sm font-medium text-blue-100/80" role="status">
                  Cargando rutas y unidades…
                </p>
              </div>
            </div>
          ) : datos.rutas.length === 0 ? (
            <div className="grid h-full min-h-[60svh] place-items-center px-6 text-center lg:min-h-[calc(100svh-8.5rem)]">
              <div>
                <MapPin className="mx-auto text-blue-300" size={30} aria-hidden="true" />
                <p className="mt-4 text-sm font-semibold text-white">No hay rutas disponibles por el momento.</p>
                <p className="mt-2 max-w-sm text-xs leading-6 text-blue-100/65">
                  La API respondió correctamente, pero todavía no hay trazados publicados para mostrar en el mapa.
                </p>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0">
              <Suspense
                fallback={(
                  <div className="grid h-full place-items-center bg-[#0a2350]">
                    <p className="text-xs font-medium text-blue-200/80" role="status">Cargando escena 3D…</p>
                  </div>
                )}
              >
                <MapaBuses3D
                  rutas={datos.rutas}
                  micros={datos.micros}
                  mostrarBusesDemo={datos.esRespaldo}
                />
              </Suspense>
            </div>
          )}

          <div className="pointer-events-none absolute left-4 top-4 z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#081b3d]/80 px-3 py-1.5 text-[10px] font-semibold text-blue-100 backdrop-blur">
              <Radio size={12} className={datos.esRespaldo ? 'text-amber-300' : 'text-emerald-400'} aria-hidden="true" />
              {datos.cargando
                ? 'Consultando datos'
                : datos.esRespaldo
                  ? 'Datos de demostración'
                  : 'Datos públicos'}
            </span>
          </div>

          <p className="pointer-events-none absolute inset-x-4 bottom-4 z-10 rounded-xl border border-white/15 bg-[#081b3d]/85 px-3 py-2 text-[10px] font-medium leading-5 text-blue-100/80 backdrop-blur">
            Vista demostrativa: la ubicación de los micros se simula sobre los trazados registrados.
          </p>
        </section>

        <aside className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300/80">Tacna, Perú</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-white">Mapa 3D de rutas</h1>
          <p className="mt-3 text-xs leading-6 text-blue-100/65">
            Explora los trazados registrados y las unidades activas de la ciudad. La escena es
            referencial y no reemplaza la información oficial de cada empresa.
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <dt className="text-[9px] font-semibold uppercase tracking-[0.16em] text-blue-200/60">Rutas</dt>
              <dd className="mt-1 text-xl font-bold text-white">{datos.cargando ? '—' : datos.rutas.length}</dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <dt className="text-[9px] font-semibold uppercase tracking-[0.16em] text-blue-200/60">Unidades</dt>
              <dd className="mt-1 text-xl font-bold text-white">{datos.cargando ? '—' : datos.micros.length}</dd>
            </div>
          </dl>

          <div className="mt-6 flex items-center justify-between gap-3">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200/70">
              Rutas en el mapa
            </h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-blue-100/70">
              {datos.cargando ? '…' : datos.rutas.length}
            </span>
          </div>

          {datos.cargando ? (
            <div className="mt-4 space-y-2" aria-hidden="true">
              <div className="h-14 animate-pulse rounded-xl bg-white/10" />
              <div className="h-14 animate-pulse rounded-xl bg-white/10" />
            </div>
          ) : datos.rutas.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-white/15 px-3 py-4 text-center text-[11px] leading-5 text-blue-100/60">
              Sin rutas publicadas.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {datos.rutas.map(ruta => (
                <li
                  key={ruta.id}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: ruta.color }}
                      aria-hidden="true"
                    />
                    <p className="min-w-0 truncate text-xs font-semibold text-white">{ruta.nombre}</p>
                  </div>
                  <p className="mt-1 truncate pl-4 text-[10px] text-blue-100/55">
                    {ruta.empresa} · {ruta.coordenadas.length} puntos
                  </p>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 flex gap-3 rounded-xl border border-amber-300/15 bg-amber-300/5 p-3">
            <ShieldCheck size={17} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
            <p className="text-[10px] leading-5 text-blue-100/65">
              {datos.esRespaldo
                ? 'La API no respondió. Se muestran rutas y unidades de demostración para conservar la vista.'
                : datos.rutas.length === 0
                  ? 'La API respondió correctamente, pero no hay rutas publicadas para mostrar en el mapa.'
                  : 'Las unidades se animan sobre los trazados registrados; no son posiciones GPS en vivo.'}
            </p>
          </div>

          <a
            href="/"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Volver al inicio
          </a>
        </aside>
      </main>
    </div>
  );
}
