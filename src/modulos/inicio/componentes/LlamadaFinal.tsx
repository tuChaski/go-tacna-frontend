import { useAuth } from '../../../hooks/useAuth';
import { enlaceCuenta, etiquetaCuenta } from '../../autenticacion/enlaces-sesion';
export function LlamadaFinal() {
  const { user } = useAuth();
  return <section className="gt-cierre"><div className="gt-contenedor gt-cierre-interior"><div><h2>Tu ciudad, a tu ritmo</h2><p>Puedes consultar las rutas como invitado o acceder a tu cuenta.</p></div><a className="gt-boton gt-boton-secundario" href={user ? enlaceCuenta(user) : '/registro'}>{user ? etiquetaCuenta(user) : 'Crear cuenta de pasajero'}</a></div></section>;
}
