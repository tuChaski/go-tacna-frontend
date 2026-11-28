import '@fontsource-variable/inter';
import { useDatosInicio } from './datos/useDatosInicio';
import { BarraNavegacion } from './componentes/BarraNavegacion';
import { Hero } from './componentes/Hero';
import { SeccionCaracteristicas } from './componentes/SeccionCaracteristicas';
import { SeccionRutas } from './componentes/SeccionRutas';
import { SeccionFlotas } from './componentes/SeccionFlotas';
import { LlamadaFinal } from './componentes/LlamadaFinal';
import { PiePagina } from './componentes/PiePagina';

export function Inicio() {
  const datos = useDatosInicio();

  return (
    <div id="inicio" className="gt-web">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#1d63ed] focus:shadow-lg"
      >
        Saltar al contenido
      </a>

      <BarraNavegacion />

      <main id="contenido">
        <Hero datos={datos} />
        <SeccionCaracteristicas />
        <SeccionRutas
          rutas={datos.rutas}
          cargando={datos.cargando}
          error={datos.error}
          total={datos.total}
          reintentar={datos.reintentar}
        />
        <SeccionFlotas />
        <LlamadaFinal />
      </main>

      <PiePagina />
    </div>
  );
}
