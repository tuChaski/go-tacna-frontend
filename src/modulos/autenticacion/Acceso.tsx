/** Carga diferida del login: mantiene su presentación y fuente fuera de la landing. */
import { lazy, Suspense } from 'react';

const RutasAcceso = lazy(() => import('./RutasAcceso'));

export function Acceso() {
  return <Suspense fallback={<p>Cargando acceso…</p>}><RutasAcceso /></Suspense>;
}
