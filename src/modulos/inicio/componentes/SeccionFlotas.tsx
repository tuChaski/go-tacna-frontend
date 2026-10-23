import { ArrowRight, Building2, BusFront, CheckCircle2, ShieldCheck } from 'lucide-react';

const ROLES = [
  {
    icono: Building2,
    titulo: 'Empresas',
    descripcion: 'Administra rutas, micros y conductores de tu operación desde un solo panel.',
  },
  {
    icono: BusFront,
    titulo: 'Conductores',
    descripcion: 'Actualiza tu estado operativo y mantén informada a la central durante el recorrido.',
  },
  {
    icono: ShieldCheck,
    titulo: 'Administradores',
    descripcion: 'Supervisa la operación y mantén ordenada la información de la plataforma.',
  },
] as const;

const BENEFICIOS = [
  'Rutas y unidades en un solo panel',
  'Estado operativo de conductores',
  'Acceso seguro según el rol de cada usuario',
];

export function SeccionFlotas() {
  return (
    <section id="empresas" className="relative isolate scroll-mt-24 overflow-hidden bg-gradient-to-br from-[#0e2d63] via-[#0a2350] to-[#081b3d] py-20 sm:py-24">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#1d63ed]/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.95fr] lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-100 backdrop-blur">
              <Building2 size={13} aria-hidden="true" />
              Para empresas y operadores
            </span>

            <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.03em] text-white sm:text-4xl">
              Una flota ordenada, una ciudad conectada
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-blue-100/80">
              Go Tacna también está pensado para quienes operan el transporte. Centraliza rutas,
              unidades y personas en una herramienta clara, segura y fácil de usar.
            </p>

            <ul className="mt-7 space-y-3">
              {BENEFICIOS.map(beneficio => (
                <li key={beneficio} className="flex items-start gap-2.5 text-sm text-blue-50/85">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-cyan-300" aria-hidden="true" />
                  {beneficio}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/login"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0e2d63] shadow-lg shadow-blue-950/20 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
              >
                Ingresar al panel
                <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a
                href="/registro"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
              >
                Registrar mi empresa
              </a>
            </div>
          </div>

          <div className="grid gap-3">
            {ROLES.map(({ icono: Icono, titulo, descripcion }) => (
              <article
                key={titulo}
                className="rounded-xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur transition duration-300 hover:border-blue-300/30 hover:bg-white/[0.08]"
              >
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#1d63ed]/20 text-cyan-200">
                    <Icono size={21} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{titulo}</h3>
                    <p className="mt-1 text-xs leading-5 text-blue-100/70">{descripcion}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
