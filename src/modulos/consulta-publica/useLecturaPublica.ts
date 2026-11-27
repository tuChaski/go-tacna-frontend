import { useEffect, useState } from 'react';
import { mensajeConsulta } from './servicio-consulta';

/** La clave incluye selección, página y revisión. No se muestran datos de una
 * clave anterior mientras llega la nueva respuesta. El callback debe ser estable. */
export function useLecturaPublica<T>(clave: string, cargar: (signal: AbortSignal) => Promise<T>) {
  const [lectura, establecerLectura] = useState<{ clave: string; datos?: T; error?: string }>({ clave: '' });
  useEffect(() => {
    const controlador = new AbortController();
    void cargar(controlador.signal).then(datos => {
      if (!controlador.signal.aborted) establecerLectura({ clave, datos });
    }).catch(error => {
      if (!controlador.signal.aborted) establecerLectura({ clave, error: mensajeConsulta(error) });
    });
    return () => controlador.abort();
  }, [clave, cargar]);
  return lectura.clave === clave ? { ...lectura, cargando: false } : { clave, cargando: true, datos: undefined, error: undefined };
}
