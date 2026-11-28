import { useCallback, useState } from 'react';
import { apiPublica } from '../../../services/api';
import { crearConsultaPublica } from '../../consulta-publica/servicio-consulta';
import { useLecturaPublica } from '../../consulta-publica/useLecturaPublica';
import { colorRuta } from '../../publico/identidad-ruta';
import type { RutaInicio } from './tipos-inicio';

const consulta = crearConsultaPublica(apiPublica);
/** Una página real del catálogo; no reemplaza errores por ejemplos ni calcula
 * totales de micros a partir de una colección parcial. */
export function useDatosInicio() {
  const [revision, establecerRevision] = useState(0);
  const cargar = useCallback((signal: AbortSignal) => consulta.rutas('', 1, signal), []);
  const lectura = useLecturaPublica(`inicio-${revision}`, cargar);
  const rutas: RutaInicio[] = (lectura.datos?.registros ?? []).map(r => ({ ...r, activa: true, color: colorRuta(r.id) }));
  return { rutas, micros: [], cargando: lectura.cargando, esRespaldo: false,
    error: lectura.error, total: lectura.datos?.total ?? 0,
    reintentar: () => establecerRevision(actual => actual + 1) };
}
