import test from 'node:test';
import assert from 'node:assert/strict';
import { colorRuta } from '../src/modulos/publico/identidad-ruta.ts';
import { enlacesContacto } from '../src/modulos/publico/contacto-publico.ts';

test('una ruta conserva su color al cambiar de página u orden del catálogo', () => {
  const primera = [9, 4, 8].map(id => ({ id, color: colorRuta(id) }));
  const segunda = [8, 9, 4].map(id => ({ id, color: colorRuta(id) }));
  for (const ruta of primera) assert.equal(segunda.find(r => r.id === ruta.id).color, ruta.color);
});
test('sin canal oficial no se generan enlaces de contacto', () => {
  assert.equal(enlacesContacto({telefono:null,whatsapp:true}), null);
  for (const telefono of ['', 'javascript:alert(1)', '+51912345678?texto=privado', '912345678']) {
    assert.equal(enlacesContacto({telefono,whatsapp:true}), null);
  }
});
test('un teléfono autorizado no habilita WhatsApp sin opción explícita', () => {
  const contacto = {telefono:'+51912345678',whatsapp:false};
  assert.deepEqual(enlacesContacto(contacto), {llamada:'tel:+51912345678',whatsapp:null});
  assert.equal(enlacesContacto({...contacto,whatsapp:true}).whatsapp, 'https://wa.me/51912345678');
});
