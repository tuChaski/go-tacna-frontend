import { useEffect, useRef, useState } from 'react';
import type { MicroInicio, RutaInicio } from '../datos/tipos-inicio';
import { crearEscenaBuses } from '../tres/escena-buses';
import { MapaBusesRespaldo } from './MapaBusesRespaldo';

interface Props {
  rutas: readonly RutaInicio[];
  micros: readonly MicroInicio[];
  mostrarBusesDemo?: boolean;
}

/**
 * Puente entre React y Three.js. La escena se crea una vez por conjunto de
 * datos y se destruye al desmontar, sin dejar contextos WebGL abiertos.
 */
export function MapaBuses3D({ rutas, micros, mostrarBusesDemo = false }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [error, establecerError] = useState(false);

  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo) return;

    let escena: ReturnType<typeof crearEscenaBuses> | undefined;
    let cancelado = false;

    // La creación se difiere un frame para no encadenar renders desde el
    // cuerpo del efecto y para esperar a que el contenedor tenga tamaño.
    const cuadro = requestAnimationFrame(() => {
      if (cancelado) return;

      if (rutas.length === 0) {
        establecerError(true);
        return;
      }

      try {
        escena = crearEscenaBuses({ contenedor: nodo, rutas, micros, mostrarBusesDemo });
        establecerError(false);
      } catch (fallo) {
        console.error('No se pudo iniciar el mapa 3D de la landing.', fallo);
        establecerError(true);
      }
    });

    return () => {
      cancelado = true;
      cancelAnimationFrame(cuadro);
      escena?.destruir();
    };
  }, [micros, mostrarBusesDemo, rutas]);

  return (
    <div className="relative h-full w-full">
      <div ref={contenedor} className="h-full w-full" aria-hidden="true" />
      {error && (
        <div className="absolute inset-0">
          <MapaBusesRespaldo rutas={rutas} />
        </div>
      )}
    </div>
  );
}
