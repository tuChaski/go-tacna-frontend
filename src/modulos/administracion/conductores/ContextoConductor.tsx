/** Explica quién entrega las credenciales y dónde se gestiona la asignación del micro. */
import { BusFront, KeyRound, UserRound } from 'lucide-react';

export function ContextoConductor({ nombre = '' }: { nombre?: string }) {
  return (
    <aside className="admin-card admin-context" aria-label="Información del conductor">
      <span className="admin-icon-tile"><UserRound size={24} aria-hidden="true" /></span>
      <h2>{nombre.trim() || 'Acceso del conductor'}</h2>
      <p className="admin-muted">Empresa: Andino Demo</p>

      {/* Las credenciales las entrega la empresa; no se envían desde esta vista previa. */}
      <div className="admin-info-note">
        <KeyRound size={20} aria-hidden="true" />
        <p>La empresa entrega el correo y la contraseña inicial al conductor para acceder a la aplicación móvil.</p>
      </div>

      {/* La asociación se centralizará en Micros para evitar dos asignaciones contradictorias. */}
      <div className="admin-info-note">
        <BusFront size={20} aria-hidden="true" />
        <p>La asignación se realiza desde Micros: un conductor por micro y un micro por conductor a la vez.</p>
      </div>
      <p className="admin-small admin-muted">Las contraseñas existentes no se muestran en el listado ni en el detalle.</p>
    </aside>
  );
}
