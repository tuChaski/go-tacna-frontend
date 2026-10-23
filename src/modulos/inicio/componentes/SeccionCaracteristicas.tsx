import { Building2, MapPin, Route } from 'lucide-react';
import { TarjetaCaracteristica } from './TarjetaCaracteristica';

const CARACTERISTICAS = [
  {
    numero: '01',
    icono: MapPin,
    titulo: 'Mapa 3D de rutas',
    descripcion:
      'Explora los trazados registrados y las unidades activas sobre una vista 3D referencial de la ciudad.',
    detalles: ['Trazados registrados por empresa', 'Vista 3D referencial'],
  },
  {
    numero: '02',
    icono: Route,
    titulo: 'Consulta de rutas y unidades',
    descripcion:
      'Revisa las rutas publicadas y las unidades activas que reporta la API pública de Go Tacna.',
    detalles: ['Rutas y unidades públicas', 'Información clara antes de salir'],
  },
  {
    numero: '03',
    icono: Building2,
    titulo: 'Gestión de flotas',
    descripcion:
      'Las empresas y conductores cuentan con un panel para administrar rutas, unidades y el estado operativo de la flota.',
    detalles: ['Panel para empresas y conductores', 'Control de rutas y unidades'],
  },
] as const;

export function SeccionCaracteristicas() {
  return (
    <section id="caracteristicas" className="scroll-mt-24 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1d63ed]">
            Todo en una sola plataforma
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] text-slate-900 sm:text-4xl">
            La información que necesitas antes de subir al micro
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Go Tacna reúne los recorridos registrados, las unidades activas y las herramientas
            de gestión para que te muevas con información clara por la ciudad.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {CARACTERISTICAS.map(caracteristica => (
            <TarjetaCaracteristica key={caracteristica.numero} {...caracteristica} />
          ))}
        </div>
      </div>
    </section>
  );
}
