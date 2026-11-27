/**
 * Edición accesible del recorrido: mapa para señalar puntos y controles con
 * teclado para introducir, corregir y ordenar coordenadas. El historial es local
 * y permite recuperar el trazado tras eliminar puntos o limpiar la copia temporal.
 */
import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { MapaRuta } from './MapaRuta';
import { puntoValido } from './trazado-ruta';
import type { PuntoRuta } from './trazado-ruta';

interface PropiedadesEditor {
  puntos: readonly PuntoRuta[];
  error?: string;
  alCambiar: (puntos: PuntoRuta[]) => void;
}

export function EditorTrazadoRuta({ puntos, error, alCambiar }: PropiedadesEditor) {
  const [seleccionando, establecerSeleccionando] = useState(false);
  const [historial, establecerHistorial] = useState<PuntoRuta[][]>([]);
  const [latitud, establecerLatitud] = useState('');
  const [longitud, establecerLongitud] = useState('');
  const [indiceEditado, establecerIndiceEditado] = useState<number | null>(null);
  const [errorCoordenada, establecerErrorCoordenada] = useState('');
  const entradaLatitud = useRef<HTMLInputElement>(null);

  /** Cada cambio conserva el estado anterior; nunca muta el ejemplo ni los props. */
  function actualizar(siguientes: PuntoRuta[]) {
    establecerHistorial(anteriores => [...anteriores, puntos.map(punto => ({ ...punto }))]);
    alCambiar(siguientes);
    cancelarEdicion();
  }
  function cancelarEdicion() {
    establecerLatitud(''); establecerLongitud(''); establecerIndiceEditado(null); establecerErrorCoordenada('');
  }
  function deshacer() {
    const anterior = historial.at(-1);
    if (!anterior) return;
    establecerHistorial(historial.slice(0, -1));
    alCambiar(anterior);
    cancelarEdicion();
  }
  function agregarDesdeMapa(punto: PuntoRuta) {
    const ultimo = puntos.at(-1);
    if (ultimo?.latitud === punto.latitud && ultimo.longitud === punto.longitud) return;
    actualizar([...puntos, punto]);
  }
  function guardarCoordenada() {
    const punto = { latitud: Number(latitud), longitud: Number(longitud) };
    if (!latitud.trim() || !longitud.trim() || !puntoValido(punto)) {
      establecerErrorCoordenada('Ingresa latitud entre −90 y 90 y longitud entre −180 y 180.');
      entradaLatitud.current?.focus();
      return;
    }
    actualizar(indiceEditado === null ? [...puntos, punto] : puntos.map((actual, indice) => indice === indiceEditado ? punto : actual));
  }
  // Enter confirma el punto sin disparar el guardado del formulario de la ruta.
  function alPulsarTecla(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Enter') { evento.preventDefault(); guardarCoordenada(); }
  }
  function mover(indice: number, desplazamiento: number) {
    const siguientes = [...puntos];
    const destino = indice + desplazamiento;
    [siguientes[indice], siguientes[destino]] = [siguientes[destino], siguientes[indice]];
    actualizar(siguientes);
  }

  return <section className="admin-trazado-editor" id="route-trazado" tabIndex={-1} aria-labelledby="trazado-titulo" aria-describedby="trazado-ayuda trazado-error">
    <h2 id="trazado-titulo">Recorrido de la ruta</h2>
    <p id="trazado-ayuda" className="admin-small admin-muted">Define al menos dos puntos, desde el inicio hasta el final. Los puntos describen el recorrido; no son paradas obligatorias.</p>
    <div className="admin-trazado-herramientas">
      <button type="button" className={seleccionando ? 'admin-button' : 'admin-button admin-outline'} aria-pressed={seleccionando}
        onClick={() => establecerSeleccionando(actual => !actual)}>{seleccionando ? 'Terminar de marcar puntos' : 'Marcar puntos en el mapa'}</button>
      <button type="button" className="admin-button admin-outline" disabled={!historial.length} onClick={deshacer}>Deshacer</button>
      <button type="button" className="admin-button admin-outline" disabled={!puntos.length} onClick={() => actualizar([])}>Limpiar recorrido</button>
    </div>
    <p className="admin-small" role="status">{seleccionando ? 'Modo de marcado activo: pulsa sobre el mapa para añadir puntos en orden.' : 'Puedes desplazar el mapa o agregar puntos con coordenadas.'}</p>
    <MapaRuta puntos={puntos} seleccionando={seleccionando} alSeleccionar={agregarDesdeMapa} />
    <p id="trazado-error" className={error ? 'admin-field-error' : 'admin-field-help'} aria-live="polite">{error || `${puntos.length} puntos definidos.`}</p>

    {/* Alternativa completa al clic: permite usar teclado y corregir un punto concreto. */}
    <fieldset className="admin-coordenadas">
      <legend>{indiceEditado === null ? 'Añadir un punto por coordenadas' : `Editar punto ${indiceEditado + 1}`}</legend>
      <div className="admin-coordenadas-campos">
        <div className="admin-field"><label htmlFor="punto-latitud">Latitud del punto</label>
          <input ref={entradaLatitud} id="punto-latitud" type="number" step="any" min={-90} max={90} value={latitud}
            aria-invalid={Boolean(errorCoordenada)} aria-describedby="coordenadas-ayuda" onKeyDown={alPulsarTecla}
            onChange={evento => { establecerLatitud(evento.target.value); establecerErrorCoordenada(''); }} /></div>
        <div className="admin-field"><label htmlFor="punto-longitud">Longitud del punto</label>
          <input id="punto-longitud" type="number" step="any" min={-180} max={180} value={longitud}
            aria-invalid={Boolean(errorCoordenada)} aria-describedby="coordenadas-ayuda" onKeyDown={alPulsarTecla}
            onChange={evento => { establecerLongitud(evento.target.value); establecerErrorCoordenada(''); }} /></div>
      </div>
      <p id="coordenadas-ayuda" className={errorCoordenada ? 'admin-field-error' : 'admin-field-help'} aria-live="polite">{errorCoordenada || 'Usa grados decimales. Por ejemplo: latitud −18.0066 y longitud −70.2463.'}</p>
      <div className="admin-trazado-herramientas">
        <button type="button" className="admin-button admin-outline" onClick={guardarCoordenada}>{indiceEditado === null ? 'Añadir punto' : 'Actualizar punto'}</button>
        {(indiceEditado !== null || latitud || longitud) && <button type="button" className="admin-button admin-outline" onClick={cancelarEdicion}>{indiceEditado !== null ? 'Cancelar edición del punto' : 'Descartar coordenadas'}</button>}
      </div>
    </fieldset>
    {puntos.length > 0 && <ol className="admin-puntos-ruta" aria-label="Puntos del recorrido en orden">
      {puntos.map((punto, indice) => <li key={indice}>
        <div><strong>Punto {indice + 1}</strong><span>{punto.latitud.toFixed(6)}, {punto.longitud.toFixed(6)}</span></div>
        <div className="admin-trazado-herramientas">
          <button type="button" className="admin-button admin-outline" aria-label={`Editar punto ${indice + 1}`} onClick={() => {
            establecerIndiceEditado(indice); establecerLatitud(String(punto.latitud)); establecerLongitud(String(punto.longitud)); establecerErrorCoordenada(''); entradaLatitud.current?.focus();
          }}>Editar</button>
          <button type="button" className="admin-button admin-outline" aria-label={`Subir punto ${indice + 1}`} disabled={indice === 0} onClick={() => mover(indice, -1)}>Subir</button>
          <button type="button" className="admin-button admin-outline" aria-label={`Bajar punto ${indice + 1}`} disabled={indice === puntos.length - 1} onClick={() => mover(indice, 1)}>Bajar</button>
          <button type="button" className="admin-button admin-delete-outline" aria-label={`Quitar punto ${indice + 1}`} onClick={() => actualizar(puntos.filter((_, actual) => actual !== indice))}>Quitar</button>
        </div>
      </li>)}
    </ol>}
  </section>;
}
