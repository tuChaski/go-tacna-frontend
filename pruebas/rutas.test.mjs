/** Regresiones del contrato geométrico, sin mapas externos ni base de datos. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { crearGeoJson, validarTrazado } from '../src/modulos/administracion/rutas/trazado-ruta.ts';
import { validateRouteForm } from '../src/modulos/administracion/rutas/route-form.ts';

const puntos = [
  { latitud: -18.0066, longitud: -70.2463 },
  { latitud: -18.0048, longitud: -70.2451 },
];

test('GeoJSON conserva el orden de recorrido y traduce a longitud/latitud', () => {
  const copia = structuredClone(puntos);
  assert.deepEqual(crearGeoJson(puntos), { type: 'LineString', coordinates: [[-70.2463, -18.0066], [-70.2451, -18.0048]] });
  assert.deepEqual(puntos, copia);
});
test('rechaza un trazado vacío o con un solo punto antes de serializar', () => {
  for (const incompleto of [[], [puntos[0]]]) assert.throws(() => crearGeoJson(incompleto));
});
test('rechaza coordenadas fuera del rango geográfico y valores no finitos', () => {
  for (const punto of [{ latitud: 91, longitud: 0 }, { latitud: 0, longitud: -181 }, { latitud: NaN, longitud: 0 }, { latitud: 0, longitud: Infinity }]) {
    assert.throws(() => crearGeoJson([puntos[0], punto]));
  }
});
test('impide segmentos de longitud cero por puntos consecutivos iguales', () => {
  assert.ok(validarTrazado([puntos[0], puntos[0]]));
  assert.ok(validarTrazado([...puntos, puntos[1]]));
});
test('permite volver al inicio en un recorrido circular', () => {
  assert.equal(validarTrazado([...puntos, puntos[0]]), undefined);
});
test('eliminar puntos requiere volver a comprobar el mínimo de la línea', () => {
  assert.equal(validarTrazado(puntos), undefined);
  assert.ok(validarTrazado(puntos.slice(0, 1)));
});
test('el formulario exige nombre y geometría, sin los textos retirados del contrato', () => {
  const incompleto = validateRouteForm({ name: '', trazado: [] });
  assert.ok(incompleto.name);
  assert.ok(incompleto.trazado);
  assert.equal(Object.values(validateRouteForm({ name: 'Ruta de prueba', trazado: puntos })).filter(Boolean).length, 0);
});
test('el nombre respeta el máximo de 180 caracteres publicado', () => {
  assert.equal(validateRouteForm({ name: 'a'.repeat(180), trazado: puntos }).name, undefined);
  assert.ok(validateRouteForm({ name: 'a'.repeat(181), trazado: puntos }).name);
});
