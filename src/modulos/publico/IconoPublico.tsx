import {
  ArrowLeft, ArrowRight, Building2, BusFront, CheckCircle2, ChevronDown,
  ChevronRight, CircleAlert, Expand, Eye, EyeOff, MapPin, MapPinned, Menu,
  Minus, Plus, RotateCw, Route, Search, ShieldCheck, UserRound, UsersRound, X,
} from 'lucide-react';
import './iconos-publicos.css';

/** Una sola familia vectorial. El trazo conserva su grosor al cambiar de tamaño.
 * Los nombres accesibles pertenecen al botón o al texto que acompaña al icono. */
const iconos = {
  bus: BusFront, ruta: Route, mapa: MapPinned, pasajero: UserRound,
  empresa: Building2, buscar: Search, privacidad: ShieldCheck, ubicacion: MapPin,
  encuadrar: Expand, actualizar: RotateCw, advertencia: CircleAlert,
  comprobar: CheckCircle2, menu: Menu, cerrar: X, acercar: Plus, alejar: Minus,
  desplegar: ChevronDown, siguiente: ChevronRight, anterior: ArrowLeft,
  avanzar: ArrowRight, visible: Eye, oculto: EyeOff, personas: UsersRound,
};
export type NombreIconoPublico = keyof typeof iconos;

export function IconoPublico({ nombre, tamano = 20, className = '' }: {
  nombre: NombreIconoPublico;
  tamano?: 16 | 20 | 24 | 32;
  className?: string;
}) {
  const Icono = iconos[nombre];
  return <Icono className={`gt-icono ${className}`} size={tamano} strokeWidth={1.8}
    absoluteStrokeWidth aria-hidden="true" focusable="false" />;
}
