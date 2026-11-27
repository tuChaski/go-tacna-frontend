/** Motor controlado: no usa GPU ni solicita teselas de un proveedor real. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { leerTrazado, limitesRecorrido, validarPosicionPublica, textoFechaPosicion } from '../src/modulos/consulta-publica/datos-mapa.ts';
import { adaptarMicro, adaptarRuta } from '../src/modulos/consulta-publica/contrato-publico.ts';
import { crearMotorMapa } from '../src/modulos/consulta-publica/motor-mapa.ts';
import { estiloMapaPublico, solicitudMapa, CENTRO_TACNA } from '../src/modulos/consulta-publica/proveedor-mapa.ts';

const linea = { type: 'LineString', coordinates: [[-70.24, -18], [-70.26, -18.02], [-70.25, -18.01]] };
const ruta = (id = 1) => adaptarRuta({ id, activo: true, nombre_ruta: `Ruta ${id}`, trazado_ruta: linea });
const posicion = { longitud: -70.25, latitud: -18.01, fecha: '2026-11-26T15:00:00Z' };
const micro = (id = 1, rutaId = 1) => ({ id, rutaId, placa: '<b>FICTICIO</b>', estado: 'en_recorrido', empresa: 'Prueba', capacidad: 24, posicion });

function transporte() {
  let mapa;
  const marcadores = [];
  class Mapa {
    eventos = new Map(); capas = []; fuentes = new Map(); encuadres = []; saltos = []; zooms = []; eliminaciones = 0; cambios = 0;
    touchZoomRotate = { disableRotation() {} };
    constructor(opciones) { this.opciones = opciones; mapa = this; }
    on(nombre, callback) { this.eventos.set(nombre, callback); }
    off(nombre, callback) { assert.equal(this.eventos.get(nombre), callback); this.eventos.delete(nombre); }
    emitir(nombre) { this.eventos.get(nombre)?.(); }
    addControl() {}
    getCanvas() { return { setAttribute() {} }; }
    addSource(id, fuente) { this.fuentes.set(id, { ...fuente, setData: datos => { this.datos = datos; this.cambios++; } }); }
    getSource(id) { return this.fuentes.get(id); }
    addLayer(capa) { this.capas.push(capa); }
    fitBounds(limites, opciones) { this.encuadres.push({ limites, opciones }); }
    jumpTo(opciones) { this.saltos.push(opciones); }
    getZoom() { return 13; }
    zoomTo(zoom, opciones) { this.zooms.push({ zoom, opciones }); }
    resize() { this.redimensionado = true; }
    remove() { this.eliminaciones++; }
  }
  class Marcador {
    eliminado = false;
    constructor(opciones) { this.boton = opciones.element; marcadores.push(this); }
    setLngLat(coordenadas) { this.coordenadas = coordenadas; return this; }
    addTo() { return this; }
    remove() { this.eliminado = true; }
  }
  const crearBoton = () => ({
    atributos: {}, eventos: new Map(),
    setAttribute(nombre, valor) { this.atributos[nombre] = valor; },
    addEventListener(nombre, fn) { this.eventos.set(nombre, fn); },
    removeEventListener(nombre, fn) { assert.equal(this.eventos.get(nombre), fn); this.eventos.delete(nombre); },
  });
  const estados = [];
  const motor = crearMotorMapa({ Map: Mapa, Marker: Marcador, AttributionControl: class {} }, {}, estado => estados.push(estado), crearBoton);
  const actualizar = cambios => motor.actualizar({ ruta: ruta(), micros: [], seleccionado: null, alSeleccionar() {}, ...cambios });
  return { motor, mapa, marcadores, estados, actualizar };
}

test('GeoJSON conserva longitud, latitud y el orden exacto de los puntos', () => {
  const lectura = leerTrazado(linea);
  assert.deepEqual(lectura.coordenadas[0], { longitud: -70.24, latitud: -18 });
  assert.deepEqual(limitesRecorrido(lectura.coordenadas), [[-70.26, -18.02], [-70.24, -18]]);
});
test('distingue ausencia de trazado de un formato incompatible', () => {
  assert.deepEqual(leerTrazado(null), { coordenadas: [] });
  for (const valor of [false, 'texto', {}, [], { type: 'Point', coordinates: [-70, -18] }, { type: 'Feature', geometry: linea }]) {
    assert.deepEqual(leerTrazado(valor), { coordenadas: [], trazadoInvalido: true });
  }
});
test('nunca dibuja parcialmente un recorrido corrupto', () => {
  for (const punto of [[NaN, -18], [Infinity, -18], [-181, -18], [-70, 91], ['-70', -18], [-70], [-70, -18, 10], null]) {
    assert.equal(leerTrazado({ ...linea, coordinates: [linea.coordinates[0], punto, linea.coordinates[1]] }).trazadoInvalido, true);
  }
});
test('exige dos puntos distintos y limita trazados excesivos', () => {
  for (const coordinates of [[], [[-70, -18]], [[-70, -18], [-70, -18]], Array(20001).fill([-70, -18])]) {
    assert.deepEqual(leerTrazado({ ...linea, coordinates }).coordenadas, []);
  }
  assert.equal(limitesRecorrido([]), null);
});
test('una ruta con geometría inválida conserva nombre e identidad', () => {
  const resultado = adaptarRuta({ id: 3, activo: true, nombre_ruta: 'Sin trazado', trazado_ruta: {} });
  assert.equal(resultado.id, 3); assert.equal(resultado.trazadoInvalido, true);
});
test('la posición necesita coordenadas numéricas y una fecha ISO con zona', () => {
  assert.deepEqual(validarPosicionPublica(posicion), { ...posicion, fecha: '2026-11-26T15:00:00.000Z' });
  for (const valor of [null, {}, { ...posicion, longitud: 181 }, { ...posicion, latitud: '18' }, { ...posicion, fecha: null }, { ...posicion, fecha: '2026-11-26 15:00:00' }, { ...posicion, fecha: '2026-02-30T12:00:00Z' }]) assert.equal(validarPosicionPublica(valor), null);
});
test('fecha con desplazamiento se normaliza y se presenta en hora de Perú', () => {
  assert.equal(validarPosicionPublica({ ...posicion, fecha: '2026-11-26T10:00:00-05:00' }).fecha, '2026-11-26T15:00:00.000Z');
  assert.match(textoFechaPosicion(posicion), /2026/);
});
test('el adaptador real no asume autorización por recibir historial o campos GPS', () => {
  const resultado = adaptarMicro({ id: 1, ruta_id: 1, placa: 'PRUEBA', estado: 'disponible',
    posiciones: [posicion], ultima_posicion: posicion, posicion_publica: posicion, conductor_actual: { usuario: { dni: 'NO-GUARDAR' } } }, 1);
  assert.equal(resultado.posicion, null);
  assert.ok(!JSON.stringify(resultado).includes('NO-GUARDAR'));
});
test('proveedor usa HTTPS, estilo local y atribución OSM visible', () => {
  const estilo = estiloMapaPublico();
  assert.equal(estilo.sources.calles.tiles[0], 'https://tile.openstreetmap.org/{z}/{x}/{y}.png');
  assert.match(estilo.sources.calles.attribution, /openstreetmap.org\/copyright/);
  assert.equal(estilo.sources.calles.maxzoom, 19);
  assert.equal(estilo.glyphs, undefined);
});
test('fuentes ajenas, credenciales en URL y parámetros no son admitidos', () => {
  assert.deepEqual(solicitudMapa('https://tile.openstreetmap.org/12/1248/2256.png'), { url: 'https://tile.openstreetmap.org/12/1248/2256.png', credentials: 'same-origin' });
  for (const url of ['http://tile.openstreetmap.org/1/1/1.png', 'https://otro.example/1/1/1.png', 'https://tile.openstreetmap.org/1/1/1.png?token=privado', 'https://usuario:clave@tile.openstreetmap.org/1/1/1.png', 'https://tile.openstreetmap.org/estilo.json']) assert.throws(() => solicitudMapa(url));
});
test('inicia en Tacna y espera load antes de añadir fuentes', () => {
  const t = transporte(); t.actualizar({ ruta: ruta() });
  assert.deepEqual(t.mapa.opciones.center, CENTRO_TACNA);
  assert.equal(t.mapa.capas.length, 0);
  t.mapa.emitir('load');
  assert.equal(t.mapa.capas.length, 2); assert.equal(t.mapa.encuadres.length, 1);
  assert.equal(t.mapa.datos.features[0].geometry.type, 'LineString');
  t.motor.destruir();
});
test('tarjetas y actualizaciones de una ruta conservan cámara y geometría', () => {
  const t = transporte(); const r = ruta();
  t.actualizar({ ruta: r }); t.mapa.emitir('load');
  for (let i = 0; i < 5; i++) t.actualizar({ ruta: r, seleccionado: i, micros: [] });
  assert.equal(t.mapa.encuadres.length, 1); assert.equal(t.mapa.cambios, 1);
  t.motor.verRecorrido(); assert.equal(t.mapa.encuadres.length, 2);
  assert.equal(t.mapa.encuadres[0].opciones.duration, 0);
  t.motor.destruir();
});
test('cambios rápidos antes de load solo dibujan la última ruta', () => {
  const t = transporte(); t.actualizar({ ruta: ruta(1) }); t.actualizar({ ruta: ruta(2) });
  t.actualizar({ ruta: { ...ruta(3), coordenadas: [] } }); t.mapa.emitir('load');
  assert.deepEqual(t.mapa.datos.features, []); assert.equal(t.mapa.encuadres.length, 0);
  assert.equal(t.mapa.saltos.length, 1); t.motor.destruir();
});
test('cambiar o cerrar ruta retira el trazado anterior y no acumula capas', () => {
  const t = transporte(); t.actualizar({}); t.mapa.emitir('load');
  t.actualizar({ ruta: ruta(2) }); t.actualizar({ ruta: null });
  assert.equal(t.mapa.capas.length, 2); assert.deepEqual(t.mapa.datos.features, []);
  assert.equal(t.mapa.encuadres.length, 2); t.motor.destruir();
});
test('micros sin posición, fecha o de otra ruta no generan marcadores', () => {
  const t = transporte(); t.actualizar({ micros: [{ ...micro(1), posicion: null }, { ...micro(2), posicion: { ...posicion, fecha: '' } }, micro(3, 2)] });
  t.mapa.emitir('load'); assert.equal(t.marcadores.length, 0); t.motor.destruir();
});
test('marcador y tarjeta comparten selección sin recrear el botón enfocado', () => {
  const t = transporte(); const r = ruta(); const m = micro(); let seleccionado;
  const elegir = (id, origen) => { seleccionado = { id, origen }; };
  t.actualizar({ ruta: r, micros: [m], alSeleccionar: elegir }); t.mapa.emitir('load');
  const boton = t.marcadores[0].boton;
  boton.eventos.get('click')();
  assert.equal(seleccionado.id, 1); assert.equal(seleccionado.origen, boton);
  t.actualizar({ ruta: r, micros: [m], seleccionado: 1, alSeleccionar: elegir });
  assert.equal(t.marcadores.length, 1); assert.equal(boton.atributos['aria-pressed'], 'true');
  assert.equal(boton.atributos['aria-label'], 'Ver detalle del micro <b>FICTICIO</b>');
  assert.equal(boton.innerHTML, undefined); assert.equal(t.mapa.encuadres.length, 1);
  t.motor.destruir(); assert.equal(boton.eventos.size, 0);
});
test('cambiar página retira marcadores y sus eventos', () => {
  const t = transporte(); t.actualizar({ micros: [micro()] }); t.mapa.emitir('load');
  t.actualizar({ micros: [] }); assert.equal(t.marcadores[0].eliminado, true);
  assert.equal(t.marcadores[0].boton.eventos.size, 0); t.motor.destruir();
});
test('fallos de teselas antes de load no se ocultan por la carga del estilo', () => {
  const t = transporte(); t.mapa.emitir('error'); t.mapa.emitir('load');
  assert.deepEqual(t.estados, ['teselas', 'teselas']); t.motor.destruir();
});
test('pérdida y recuperación de WebGL notifican estados distintos', () => {
  const t = transporte(); t.mapa.emitir('load'); t.mapa.emitir('webglcontextlost'); t.mapa.emitir('webglcontextrestored');
  assert.deepEqual(t.estados, ['listo', 'grafico', 'listo']); assert.equal(t.mapa.redimensionado, true); t.motor.destruir();
});
test('zoom manual y redimensión no recentran la cámara', () => {
  const t = transporte(); t.actualizar({}); t.mapa.emitir('load');
  t.motor.acercar(1); t.motor.acercar(-1); t.motor.redimensionar();
  assert.deepEqual(t.mapa.zooms.map(z => z.zoom), [14, 12]); assert.equal(t.mapa.encuadres.length, 1); t.motor.destruir();
});
test('desmontaje antes de load elimina eventos y es idempotente', () => {
  const t = transporte(); t.motor.destruir(); t.motor.destruir(); t.mapa.emitir('load');
  assert.equal(t.mapa.eventos.size, 0); assert.equal(t.mapa.eliminaciones, 1); assert.equal(t.mapa.capas.length, 0);
});
test('montajes repetidos no conservan mapas o eventos anteriores', () => {
  for (let i = 0; i < 10; i++) {
    const t = transporte(); t.mapa.emitir('load'); t.motor.destruir();
    assert.equal(t.mapa.eventos.size, 0); assert.equal(t.mapa.eliminaciones, 1);
  }
});
