import { Link } from 'react-router-dom';
import { ArrowRight, BusFront, Route, Users } from 'lucide-react';
import { PageHeading } from './components/PageHeading';
import { PendingNotice } from './components/PendingNotice';
import { routesPreviewPath } from './routes/route-reference';

export function CompanyHome() {
  return <>
    <PageHeading title="Panel de la empresa" description="Un espacio para organizar las rutas, los micros y los conductores de Andino Demo." />
    <section className="admin-company-welcome"><span className="admin-eyebrow">ANDINO DEMO · TACNA</span><h2>Comienza por tus recorridos</h2><p>Define las rutas que conectan a tus pasajeros. Después podrás asociar los micros y sus conductores.</p><Link className="admin-button" to={routesPreviewPath}>Gestionar rutas<ArrowRight size={18} aria-hidden="true" /></Link></section>
    <div className="admin-module-grid">
      <section className="admin-card admin-context"><span className="admin-icon-tile"><Route size={24} aria-hidden="true" /></span><h2>Rutas</h2><p className="admin-muted">Consulta recorridos, completa sus datos y revisa las acciones disponibles.</p><Link className="admin-back-link" to={routesPreviewPath}>Ver rutas<ArrowRight size={18} aria-hidden="true" /></Link></section>
      <section className="admin-card admin-context"><BusFront size={24} aria-hidden="true" /><h2>Micros</h2><p className="admin-muted">Asociación de unidades, rutas y conductores.</p><span className="admin-small admin-muted">Pantallas pendientes</span></section>
      <section className="admin-card admin-context"><Users size={24} aria-hidden="true" /><h2>Conductores</h2><p className="admin-muted">Datos y credenciales de los conductores de la empresa.</p><span className="admin-small admin-muted">Pantallas pendientes</span></section>
    </div>
    <PendingNotice />
  </>;
}
