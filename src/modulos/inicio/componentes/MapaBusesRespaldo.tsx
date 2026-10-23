import type { RutaInicio } from '../datos/tipos-inicio';
import { proyectarRutas } from '../tres/proyeccion';

interface Props {
  rutas: readonly RutaInicio[];
}

/** Respaldo sin WebGL: conserva el trazado y la lectura de las rutas. */
export function MapaBusesRespaldo({ rutas }: Props) {
  const rutasPlanas = proyectarRutas(rutas, 8);
  const aSvg = (x: number, z: number) => ({
    x: 12 + ((x + 4) / 8) * 76,
    y: 12 + ((z + 4) / 8) * 76,
  });

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#081b3d]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(29,99,237,0.28),transparent_68%)]" />
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label="Vista referencial de las rutas de Tacna"
      >
        <defs>
          <pattern id="respaldo-grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#1e3a8a" strokeWidth="0.25" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#respaldo-grid)" />
        {rutasPlanas.map(ruta => {
          const puntos = ruta.puntos.map(punto => aSvg(punto.x, punto.z));
          const linea = puntos.map(punto => `${punto.x},${punto.y}`).join(' ');
          const inicio = puntos[0];
          const fin = puntos[puntos.length - 1];
          return (
            <g key={ruta.id}>
              <polyline
                points={linea}
                fill="none"
                stroke={ruta.color}
                strokeWidth="1.1"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.95"
              />
              {puntos.map((punto, indice) => (
                <circle key={indice} cx={punto.x} cy={punto.y} r="0.9" fill="#ffffff" />
              ))}
              {inicio && <circle cx={inicio.x} cy={inicio.y} r="1.8" fill={ruta.color} stroke="#ffffff" strokeWidth="0.5" />}
              {fin && <circle cx={fin.x} cy={fin.y} r="1.8" fill="#ffffff" stroke={ruta.color} strokeWidth="0.5" />}
            </g>
          );
        })}
      </svg>
      {rutas.length === 0 && (
        <p className="absolute inset-0 grid place-items-center px-6 text-center text-[11px] font-medium text-blue-200/70">
          No hay rutas registradas para mostrar.
        </p>
      )}
      <p className="absolute bottom-3 left-3 rounded-full border border-white/15 bg-[#081b3d]/80 px-2.5 py-1 text-[10px] font-medium text-blue-100/80 backdrop-blur">
        Vista demostrativa
      </p>
    </div>
  );
}
