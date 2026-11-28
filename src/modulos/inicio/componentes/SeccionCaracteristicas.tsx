import { IconoPublico } from '../../publico/IconoPublico';
import type { NombreIconoPublico } from '../../publico/IconoPublico';

const beneficios: { nombre: NombreIconoPublico; texto: string }[] = [
  { nombre: 'ruta', texto: 'Encuentra tu ruta' },
  { nombre: 'mapa', texto: 'Explora su recorrido' },
  { nombre: 'bus', texto: 'Consulta sus micros' },
  { nombre: 'privacidad', texto: 'Entra sin crear una cuenta' },
];
export function SeccionCaracteristicas() {
  return <section className="gt-beneficios" aria-label="Qué puedes consultar"><ul className="gt-contenedor">
    {beneficios.map(({ nombre, texto }) => <li key={nombre}><span className="gt-icono-superficie"><IconoPublico nombre={nombre} /></span><span>{texto}</span></li>)}
  </ul></section>;
}
