/** Carga diferida del login: mantiene su presentación y fuente fuera de la landing. */
import { lazy, Suspense } from 'react';

const InicioSesion = lazy(() => import('./InicioSesion'));

export function Acceso() {
  return <Suspense fallback={<p>Cargando acceso…</p>}><InicioSesion /></Suspense>;
}
