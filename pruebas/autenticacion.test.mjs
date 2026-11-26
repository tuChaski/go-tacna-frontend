/** Regresiones del contrato HTTP y validación de acceso; datos ficticios, sin red. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adaptarSesion, adaptarPerfil, prepararLogin, prepararRegistro } from '../src/services/adaptador-autenticacion.ts';
import { validarAcceso, validarAlta } from '../src/modulos/autenticacion/formulario-acceso.ts';
import { destinoSesion } from '../src/modulos/autenticacion/destino-sesion.ts';

const usuario = { id: 1, nombre: 'Cuenta', apellido: 'Ficticia', correo: 'cuenta@example.com', rol: 'admin_general', activo: true };
const respuesta = (perfil = usuario) => ({ success: true, data: { usuario: perfil, token: 'token-ficticio', tipo: 'bearer' } });
const alta = { dni: 'DOCUMENTO-DE-PRUEBA', nombre: 'Nombre', apellido: 'Apellido', telefono: '000000000', correo: 'cuenta@example.com', contrasena: 'Clave ficticia 123', confirmacion: 'Clave ficticia 123' };

test('login usa correo y no modifica espacios de la contraseña', () => {
  assert.deepEqual(prepararLogin({ email: ' cuenta@example.com ', contrasena: ' clave ' }), { correo: 'cuenta@example.com', password: ' clave ' });
});
test('registro no transmite confirmación ni permite elegir rol', () => {
  const payload = prepararRegistro({ ...alta, email: alta.correo, rol: 'admin_general' });
  assert.equal(payload.password, alta.contrasena); assert.equal(payload.correo, alta.correo);
  assert.equal(payload.apellido, alta.apellido); assert.equal('rol' in payload, false); assert.equal('confirmacion' in payload, false);
});
for (const rol of ['admin_general', 'admin_empresa', 'conductor', 'pasajero']) {
  test(`sesión interpreta rol confirmado ${rol}`, () => {
    const perfil = { ...usuario, rol, administrador_empresa_perfiles: [] };
    assert.equal(adaptarSesion(respuesta(perfil)).user.rol, rol);
    assert.equal(adaptarPerfil({ success: true, data: perfil }).rol, rol);
  });
}
test('empresas se obtienen de perfiles y se deduplican', () => {
  const perfil = { empresa_id: 12, empresa: { id: 12, razon_social: 'Empresa ficticia' } };
  assert.deepEqual(adaptarSesion(respuesta({ ...usuario, rol: 'admin_empresa', administrador_empresa_perfiles: [perfil, perfil] })).user.empresas,
    [{ id: 12, razonSocial: 'Empresa ficticia' }]);
});
for (const [nombre, perfil] of [
  ['rol antiguo', { ...usuario, rol: 'admin' }], ['cuenta inactiva', { ...usuario, activo: false }],
  ['id no numérico', { ...usuario, id: '1' }], ['sin alcance', { ...usuario, rol: 'admin_empresa' }],
  ['empresa incompatible', { ...usuario, rol: 'admin_empresa', administrador_empresa_perfiles: [{ empresa_id: 2, empresa: { id: 3, razon_social: 'Otra' } }] }],
]) test(`rechaza ${nombre}`, () => assert.throws(() => adaptarSesion(respuesta(perfil))));
test('rechaza respuesta antigua y token vacío', () => {
  assert.throws(() => adaptarSesion({ success: true, data: { user: usuario, token: 'x', type: 'bearer' } }));
  assert.throws(() => adaptarSesion({ ...respuesta(), data: { ...respuesta().data, token: '' } }));
  assert.throws(() => adaptarSesion(respuesta({ ...usuario, rol: ['admin_general'] })));
});
test('no conserva datos privados ni token dentro del usuario', () => {
  const perfil = adaptarSesion(respuesta({ ...usuario, password_hash: 'no-propagar', token: 'no-propagar' })).user;
  assert.equal('password_hash' in perfil, false); assert.equal('token' in perfil, false);
});
test('login exige presencia y correo válido sin imponer mínimo nuevo a cuentas existentes', () => {
  assert.equal(Object.keys(validarAcceso({ correo: ' ', contrasena: ' ' })).length, 2);
  assert.ok(validarAcceso({ correo: 'incorrecto', contrasena: 'x' }).correo);
  assert.deepEqual(validarAcceso({ correo: 'cuenta@example.com', contrasena: 'x' }), {});
});
test('alta válida, confirmación y política de mínimo 8', () => {
  assert.deepEqual(validarAlta(alta), {});
  assert.ok(validarAlta({ ...alta, contrasena: 'corta' }).contrasena);
  assert.ok(validarAlta({ ...alta, confirmacion: 'distinta' }).confirmacion);
});
test('alta limita longitudes publicadas y no presupone DNI de 8 dígitos', () => {
  assert.deepEqual(validarAlta({ ...alta, dni: 'DOC-X' }), {});
  for (const [campo, longitud] of [['dni', 21], ['nombre', 121], ['apellido', 121], ['telefono', 31], ['correo', 151]]) {
    assert.ok(validarAlta({ ...alta, [campo]: 'a'.repeat(longitud) })[campo]);
  }
});
test('destinos por rol separados del maquetado de desarrollo', () => {
  assert.equal(destinoSesion('admin_general'), '/admin'); assert.equal(destinoSesion('admin_empresa'), '/admin/empresa');
  assert.equal(destinoSesion('pasajero'), '/cuenta'); assert.equal(destinoSesion('conductor'), '/cuenta');
});
