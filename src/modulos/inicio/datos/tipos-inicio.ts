/** Datos mínimos que necesita la landing pública. No incluye información sensible. */
export interface CoordenadaRuta {
  latitud: number;
  longitud: number;
}

export interface RutaInicio {
  id: number;
  nombre: string;
  empresa: string;
  activa: boolean;
  coordenadas: CoordenadaRuta[];
  color: string;
}

export interface MicroInicio {
  id: number;
  placa: string;
  rutaId: number | null;
  estado: string;
  esDemo: boolean;
}

export interface DatosInicio {
  rutas: RutaInicio[];
  micros: MicroInicio[];
  cargando: boolean;
  esRespaldo: boolean;
}
