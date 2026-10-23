/** Formularios conectados al contrato administrativo. Reutilizan el estilo del
 * maquetado y el editor de Rutas. El callback confirma la escritura en Laravel;
 * la pantalla conserva los datos ante errores y bloquea envíos simultáneos.
 */
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { CuentaAdministrativa, Recurso, RegistroAdministrativo } from '../datos-administracion';
import { EditorTrazadoRuta } from '../rutas/EditorTrazadoRuta';
import { crearGeoJson, validarTrazado } from '../rutas/trazado-ruta';
import type { PuntoRuta } from '../rutas/trazado-ruta';
import { errorAdministracion } from '../../../services/administracion';

interface Campo {
  clave: string; etiqueta: string; tipo?: 'email' | 'tel' | 'password' | 'number';
  limite?: number; minimo?: number; maximo?: number; opcional?: boolean;
  opciones?: { valor: string; nombre: string; deshabilitada?: boolean }[];
  bloqueado?: boolean;
}
const camposPersona: Campo[] = [
  { clave: 'dni', etiqueta: 'DNI', limite: 20 },
  { clave: 'nombre', etiqueta: 'Nombres', limite: 120 },
  { clave: 'apellido', etiqueta: 'Apellidos', limite: 120 },
  { clave: 'telefono', etiqueta: 'Teléfono', tipo: 'tel', limite: 30 },
  { clave: 'correo', etiqueta: 'Correo de acceso', tipo: 'email', limite: 150 },
  { clave: 'password', etiqueta: 'Contraseña inicial', tipo: 'password', minimo: 8 },
];
interface PropiedadesFormulario {
  recurso: Recurso | 'cuenta'; registro?: RegistroAdministrativo; cuenta?: CuentaAdministrativa;
  rutas?: RegistroAdministrativo[]; conductores?: RegistroAdministrativo[];
  cancelar: string; alGuardar: (datos: Record<string, unknown>) => Promise<void>;
}

export function FormularioRegistro({ recurso, registro, cuenta, rutas = [], conductores = [], cancelar, alGuardar }: PropiedadesFormulario) {
  const editando = Boolean(registro || cuenta);
  let campos: Campo[];
  if (recurso === 'empresas') campos = [
    { clave: 'razon_social', etiqueta: 'Razón social', limite: 180 },
    { clave: 'ruc', etiqueta: 'RUC', limite: 11 },
    { clave: 'telefono', etiqueta: 'Teléfono de la empresa', tipo: 'tel', limite: 30 },
    { clave: 'direccion', etiqueta: 'Dirección', limite: 255 },
  ];
  else if (recurso === 'cuenta') campos = camposPersona.map(campo => campo.clave === 'password' && editando
    ? { ...campo, etiqueta: 'Nueva contraseña (opcional)', opcional: true } : campo);
  else if (recurso === 'conductores') campos = [
    ...(!editando ? camposPersona : []),
    { clave: 'licencia_conducir', etiqueta: 'Licencia de conducir', limite: 120 },
  ];
  else if (recurso === 'rutas') campos = [{ clave: 'nombre_ruta', etiqueta: 'Nombre de la ruta', limite: 180 }];
  else campos = [
    { clave: 'placa', etiqueta: 'Placa', limite: 20 },
    { clave: 'capacidad_pasajeros', etiqueta: 'Capacidad de pasajeros', tipo: 'number', minimo: 1, maximo: 100 },
    { clave: 'ruta_id', etiqueta: 'Ruta asignada', opcional: true, bloqueado: registro?.estado === 'en_recorrido', opciones: [
      { valor: '', nombre: 'Sin ruta asignada' },
      ...rutas.map(ruta => ({ valor: String(ruta.id), nombre: `${ruta.nombre_ruta}${ruta.activo ? '' : ' · Inactiva'}`, deshabilitada: !ruta.activo && ruta.id !== registro?.ruta_id })),
    ] },
    { clave: 'conductor_actual_id', etiqueta: 'Conductor asignado', opcional: true, bloqueado: registro?.estado === 'en_recorrido', opciones: [
      { valor: '', nombre: 'Sin conductor asignado' },
      ...conductores.map(conductor => {
        const ocupado = Boolean(conductor.micro_actual && conductor.micro_actual.id !== registro?.id);
        return { valor: String(conductor.id), nombre: `${conductor.usuario?.nombre} ${conductor.usuario?.apellido}${ocupado ? ' · Ocupado' : ''}${conductor.usuario?.activo === false ? ' · Cuenta inactiva' : ''}`,
          deshabilitada: (ocupado || conductor.usuario?.activo === false) && conductor.id !== registro?.conductor_actual_id };
      }),
    ] },
  ];

  // Solo campos de esta operación; no copiar contraseñas ni propiedades extra del recurso.
  const [datos, establecerDatos] = useState<Record<string, string>>(() => Object.fromEntries(campos.map(campo => {
    const origen = cuenta ?? registro;
    const valor = origen && campo.clave in origen ? origen[campo.clave as keyof typeof origen] : undefined;
    return [campo.clave, campo.tipo === 'password' ? '' : valor == null ? (campo.clave === 'capacidad_pasajeros' ? '20' : '') : String(valor)];
  })));
  const [puntos, establecerPuntos] = useState<PuntoRuta[]>(() => registro?.trazado_ruta?.coordinates?.map(([longitud, latitud]) => ({ latitud, longitud })) ?? []);
  const [errores, establecerErrores] = useState<Record<string, string>>({});
  const [mensaje, establecerMensaje] = useState('');
  const [ocupado, establecerOcupado] = useState(false);
  const [mostrar, establecerMostrar] = useState(false);
  const bloqueo = useRef(false);
  const formulario = useRef<HTMLFormElement>(null);
  const focoPendiente = useRef<string | null>(null);

  // El foco del error remoto se aplica al reactivar los controles tras la respuesta.
  useEffect(() => {
    if (!ocupado && focoPendiente.current) {
      formulario.current?.querySelector<HTMLElement>(`#registro-${focoPendiente.current}`)?.focus();
      focoPendiente.current = null;
    }
  }, [ocupado]);

  function validar(): Record<string, string> {
    const siguientes: Record<string, string> = {};
    for (const campo of campos) {
      const valor = datos[campo.clave] ?? '';
      if (!campo.opcional && !valor.trim()) siguientes[campo.clave] = 'Completa este campo.';
      else if (valor && campo.limite && [...valor.trim()].length > campo.limite) siguientes[campo.clave] = `Máximo ${campo.limite} caracteres.`;
      else if (valor && campo.tipo === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())) siguientes[campo.clave] = 'Ingresa un correo válido.';
      else if (valor && campo.tipo === 'password' && (!valor.trim() || [...valor].length < 8)) siguientes[campo.clave] = 'Utiliza al menos 8 caracteres y evita una contraseña de solo espacios.';
      else if (campo.tipo === 'number' && (!Number.isInteger(Number(valor)) || Number(valor) < (campo.minimo ?? 0) || Number(valor) > (campo.maximo ?? Infinity))) siguientes[campo.clave] = `Ingresa un número entero entre ${campo.minimo} y ${campo.maximo}.`;
    }
    if (recurso === 'empresas' && [...(datos.ruc ?? '').trim()].length !== 11) siguientes.ruc = 'El RUC debe tener 11 caracteres.';
    if (recurso === 'rutas') {
      const error = validarTrazado(puntos);
      if (error) siguientes.trazado_ruta = error;
      // Evita guardar una línea anterior si quedó una coordenada sin aplicar.
      const latitudPendiente = formulario.current?.querySelector<HTMLInputElement>('#punto-latitud')?.value;
      const longitudPendiente = formulario.current?.querySelector<HTMLInputElement>('#punto-longitud')?.value;
      if (latitudPendiente || longitudPendiente) siguientes.trazado_ruta = 'Añade o actualiza el punto pendiente, o descarta sus coordenadas antes de guardar.';
    }
    return siguientes;
  }
  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (bloqueo.current) return;
    const siguientes = validar();
    establecerErrores(siguientes); establecerMensaje('');
    const primero = campos.find(campo => siguientes[campo.clave]);
    if (primero) { formulario.current?.querySelector<HTMLElement>(`#registro-${primero.clave}`)?.focus(); return; }
    if (siguientes.trazado_ruta) { formulario.current?.querySelector<HTMLElement>('#route-trazado')?.focus(); return; }
    bloqueo.current = true; establecerOcupado(true);
    try {
      const cuerpo: Record<string, unknown> = Object.fromEntries(campos.map(campo => [campo.clave, campo.tipo === 'password' ? datos[campo.clave] : (datos[campo.clave] ?? '').trim()]));
      if (recurso === 'rutas') cuerpo.trazado_ruta = crearGeoJson(puntos);
      if (recurso === 'micros') {
        cuerpo.capacidad_pasajeros = Number(datos.capacidad_pasajeros);
        cuerpo.ruta_id = datos.ruta_id ? Number(datos.ruta_id) : null;
        cuerpo.conductor_actual_id = datos.conductor_actual_id ? Number(datos.conductor_actual_id) : null;
      }
      await alGuardar(cuerpo);
    } catch (error) {
      const explicado = errorAdministracion(error);
      establecerErrores(explicado.campos); establecerMensaje(explicado.message);
      focoPendiente.current = campos.find(campo => explicado.campos[campo.clave])?.clave ?? null;
    } finally { bloqueo.current = false; establecerOcupado(false); }
  }

  return <form className="admin-card admin-form" ref={formulario} onSubmit={evento => void enviar(evento)} noValidate>
    {recurso === 'empresas' && !editando && <p className="admin-info-note">Primero guarda la empresa. En su detalle podrás crear la cuenta de su administrador.</p>}
    {recurso === 'cuenta' && <p className="admin-info-note">Acceso de administrador de empresa. Entrega las credenciales a la persona responsable.{editando ? ' Deja la nueva contraseña vacía para conservar la actual.' : ''}</p>}
    {recurso === 'conductores' && editando && <div className="admin-info-note"><p>{registro?.usuario?.nombre} {registro?.usuario?.apellido} · {registro?.usuario?.correo}<br />La API permite editar la licencia. Los cambios de datos personales y contraseña requieren ampliar sus permisos.</p></div>}
    <fieldset className="admin-campos-conectados" disabled={ocupado}>
      {campos.map(campo => <div className="admin-field" key={campo.clave}>
        <label htmlFor={`registro-${campo.clave}`}>{campo.etiqueta}{campo.opcional && campo.tipo !== 'password' ? ' (opcional)' : ''}</label>
        {campo.opciones ? <select id={`registro-${campo.clave}`} value={datos[campo.clave] ?? ''} disabled={campo.bloqueado}
          onChange={evento => establecerDatos(actuales => ({ ...actuales, [campo.clave]: evento.target.value }))}
          aria-invalid={Boolean(errores[campo.clave])} aria-describedby={`error-${campo.clave}`}>
          {campo.opciones.map(opcion => <option key={opcion.valor} value={opcion.valor} disabled={opcion.deshabilitada}>{opcion.nombre}</option>)}
        </select> : <input id={`registro-${campo.clave}`} type={campo.tipo === 'password' && mostrar ? 'text' : campo.tipo ?? 'text'}
          required={!campo.opcional} value={datos[campo.clave] ?? ''} maxLength={campo.limite} min={campo.minimo} max={campo.maximo}
          autoComplete={campo.tipo === 'password' ? 'new-password' : 'off'} aria-invalid={Boolean(errores[campo.clave])} aria-describedby={`error-${campo.clave}`}
          onChange={evento => establecerDatos(actuales => ({ ...actuales, [campo.clave]: evento.target.value }))} />}
        <p id={`error-${campo.clave}`} className="admin-field-error">{errores[campo.clave]}</p>
      </div>)}
      {campos.some(campo => campo.tipo === 'password') && <label className="admin-mostrar-clave"><input type="checkbox" checked={mostrar} onChange={evento => establecerMostrar(evento.target.checked)} /> Mostrar contraseña</label>}
      {recurso === 'rutas' && <EditorTrazadoRuta puntos={puntos} alCambiar={establecerPuntos} error={errores.trazado_ruta} />}
      {recurso === 'micros' && registro?.estado === 'en_recorrido' && <p className="admin-pending">Finaliza el recorrido antes de cambiar la ruta o el conductor.</p>}
    </fieldset>
    {mensaje && <p role="alert" className="admin-error-servicio">{mensaje}</p>}
    <div className="admin-form-actions"><Link className="admin-button admin-outline" to={cancelar} aria-disabled={ocupado}
      onClick={evento => { if (ocupado) evento.preventDefault(); }}>Cancelar</Link><button className="admin-button" type="submit" disabled={ocupado}>{ocupado ? 'Guardando…' : 'Guardar cambios'}</button></div>
  </form>;
}
