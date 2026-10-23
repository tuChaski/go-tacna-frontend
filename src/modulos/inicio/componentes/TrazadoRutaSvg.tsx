import type { RutaInicio } from '../datos/tipos-inicio';
import { proyectarRutaSvg } from '../tres/proyeccion';

interface Props {
  ruta: RutaInicio;
  className?: string;
}

/** Miniatura del trazado guardado, sin cargar teselas ni un mapa interactivo. */
export function TrazadoRutaSvg({ ruta, className }: Props) {
  const puntos = proyectarRutaSvg(ruta);
  const linea = puntos.map(punto => `${punto.x},${punto.y}`).join(' ');
  const inicio = puntos[0];
  const fin = puntos[puntos.length - 1];
  const idCuadricula = `cuadricula-ruta-${ruta.id}`;

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <pattern id={idCuadricula} width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#bfdbfe" strokeWidth="0.45" />
        </pattern>
      </defs>
      <rect width="100" height="100" rx="10" fill="#eff6ff" />
      <rect width="100" height="100" rx="10" fill={`url(#${idCuadricula})`} opacity="0.65" />
      {puntos.length >= 2 && (
        <>
          <polyline
            points={linea}
            fill="none"
            stroke={ruta.color}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.35"
          />
          <polyline
            points={linea}
            fill="none"
            stroke="#1d63ed"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {puntos.map((punto, indice) => (
            <circle key={indice} cx={punto.x} cy={punto.y} r="1.5" fill="#ffffff" stroke="#1d63ed" strokeWidth="0.8" />
          ))}
          {inicio && <circle cx={inicio.x} cy={inicio.y} r="2.4" fill="#1d63ed" stroke="#ffffff" strokeWidth="0.8" />}
          {fin && <circle cx={fin.x} cy={fin.y} r="2.4" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />}
        </>
      )}
    </svg>
  );
}
