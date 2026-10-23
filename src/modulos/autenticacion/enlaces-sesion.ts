import type { User } from '../../types/auth';
import { destinoSesion } from './destino-sesion';

/** Enlace de cuenta para las páginas públicas. La autorización real sigue en la API. */
export function enlaceCuenta(user: User | null): string {
  return user ? destinoSesion(user.rol) : '/login';
}

/** Los únicos roles que tienen un panel administrativo propio. */
export function tienePanelAdministrativo(user: User | null): boolean {
  return user?.rol === 'admin_general' || user?.rol === 'admin_empresa';
}

/** Etiqueta breve y consistente para la cuenta en la landing. */
export function etiquetaCuenta(user: User | null): string {
  if (!user) return 'Iniciar sesión';
  return tienePanelAdministrativo(user) ? 'Ir al panel' : 'Mi cuenta';
}
