import { AuthProvider } from './context/AuthContext';
import { Inicio } from './modulos/inicio/Inicio';
import { MapaPublico } from './modulos/inicio/MapaPublico';

/**
 * Páginas públicas que comparten la sesión sin montar el router de acceso.
 * El login y el panel conservan su propio árbol para no alterar su flujo.
 */
export function SitioPublico({ mapa = false }: { mapa?: boolean }) {
  return (
    <AuthProvider>
      {mapa ? <MapaPublico /> : <Inicio />}
    </AuthProvider>
  );
}
