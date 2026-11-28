import { IconoPublico } from '../../publico/IconoPublico';
import { enlacesContacto } from '../../publico/contacto-publico';
import { useAuth } from '../../../hooks/useAuth';
import { enlaceCuenta, tienePanelAdministrativo } from '../../autenticacion/enlaces-sesion';

export function SeccionFlotas() {
  const { user } = useAuth();
  const contacto = enlacesContacto();
  return <section id="empresas" className="gt-empresas"><div className="gt-contenedor gt-empresas-interior">
    <div><span className="gt-kicker gt-kicker-con-icono"><span className="gt-icono-superficie"><IconoPublico nombre="empresa" tamano={20} /></span> Para empresas y operadores</span>
      <h2>Gestiona tu flota con Go Tacna</h2><p>Organiza rutas, unidades y conductores desde el panel de tu operación.</p>
      <ul><li>Rutas y unidades en un solo lugar</li><li>Acceso según el rol de cada usuario</li></ul>
      <a className="gt-boton" href={enlaceCuenta(user)}>{tienePanelAdministrativo(user) ? 'Ir a mi panel' : user ? 'Ir a mi cuenta' : 'Acceder al panel'}</a><p className="gt-aviso-acceso">Acceso para administradores autorizados</p>
    </div><div className="gt-contacto"><h3>¿Quieres incorporar tu empresa?</h3><p>La incorporación de empresas se coordina con la administración de Go Tacna.</p><p>El registro público está destinado a pasajeros.</p>{contacto && <div className="gt-contacto-acciones"><a className="gt-boton" href={contacto.llamada}>Llamar a Go Tacna</a>{contacto.whatsapp && <a className="gt-boton" href={contacto.whatsapp}>WhatsApp</a>}</div>}</div>
  </div></section>;
}
