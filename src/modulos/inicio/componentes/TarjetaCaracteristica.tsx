import type { LucideIcon } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  numero: string;
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
  detalles: readonly string[];
}

export function TarjetaCaracteristica({ numero, icono: Icono, titulo, descripcion, detalles }: Props) {
  return (
    <article className="group rounded-xl border border-slate-200 bg-gray-50 p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-blue-950/5">
      <div className="flex items-center justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-[#1d63ed] transition group-hover:bg-[#1d63ed] group-hover:text-white">
          <Icono size={24} aria-hidden="true" />
        </span>
        <span className="text-xs font-bold tracking-[0.2em] text-slate-300">{numero}</span>
      </div>

      <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-900">{titulo}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{descripcion}</p>

      <ul className="mt-4 space-y-2">
        {detalles.map(detalle => (
          <li key={detalle} className="flex items-start gap-2 text-xs leading-5 text-slate-500">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#1d63ed]" aria-hidden="true" />
            {detalle}
          </li>
        ))}
      </ul>
    </article>
  );
}
