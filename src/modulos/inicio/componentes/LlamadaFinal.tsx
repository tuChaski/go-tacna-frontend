import { ArrowRight, Download } from 'lucide-react';

export function LlamadaFinal() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="relative isolate overflow-hidden rounded-xl bg-gradient-to-br from-[#1d63ed] to-[#0e2d63] px-6 py-10 shadow-xl shadow-blue-950/10 sm:px-10 sm:py-12 lg:px-14">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-blue-950/25 blur-3xl" />

          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100/80">
                Empieza hoy
              </span>
              <h2 className="mt-3 max-w-xl text-3xl font-extrabold tracking-[-0.03em] text-white sm:text-4xl">
                Tu próximo micro está a un clic
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/85 sm:text-base">
                Crea tu cuenta, consulta las rutas de Tacna y organiza tus viajes con información
                clara desde el primer momento.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href="/registro"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#1d63ed] shadow-lg shadow-blue-950/15 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Crear cuenta gratis
                <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Iniciar sesión
              </a>
            </div>
          </div>

          <div className="relative mt-8 flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/15 text-white">
              <Download size={19} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold text-white">App móvil Go Tacna</p>
              <p className="mt-0.5 text-[11px] text-blue-100/75">
                Disponible próximamente para pasajeros.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
