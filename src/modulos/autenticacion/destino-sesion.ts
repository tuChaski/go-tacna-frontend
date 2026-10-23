import type { Role } from '../../types/auth';

/** Solo decide la navegación. La autorización de recursos siempre se aplica en la API. */
export function destinoSesion(rol: Role) {
  if (rol === 'admin_general') return '/admin';
  if (rol === 'admin_empresa') return '/admin/empresa';
  return '/cuenta';
}
