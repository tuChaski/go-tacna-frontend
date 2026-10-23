/** Orquesta las vistas reales de listado, consulta y escritura de un recurso.
 * Las consultas se cancelan al navegar; su clave impide mostrar datos de la
 * empresa o página anterior. Las escrituras se confirman antes de navegar.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { cargarCatalogo, cambiarEstadoRegistro, consultarRegistro, eliminarRegistro, ErrorAdministracion, errorAdministracion, guardarCuentaEmpresa, guardarRegistro, listarRegistros } from '../../services/administracion';
import { nombresRecursos, estadoRegistro, tituloRegistro } from './datos-administracion';
import type { CuentaAdministrativa, PaginaRegistros, Recurso, RegistroAdministrativo } from './datos-administracion';
import { PageHeading } from './componentes/PageHeading';
import { FormularioRegistro } from './componentes/FormularioRegistro';
import { DialogoOperacion } from './componentes/DialogoOperacion';
import { MapaRuta } from './rutas/MapaRuta';

type Modo = 'lista' | 'nuevo' | 'detalle' | 'editar' | 'cuentaNueva' | 'cuentaEditar';
interface Consulta {
  clave: string; pagina?: PaginaRegistros; registro?: RegistroAdministrativo;
  rutas?: RegistroAdministrativo[]; conductores?: RegistroAdministrativo[]; error?: string;
}

export function GestionRecurso({ recurso, modo, empresaId, base }: { recurso: Recurso; modo: Modo; empresaId?: number; base: string }) {
  const { id, usuarioId } = useParams();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [pagina, establecerPagina] = useState(1);
  const [texto, establecerTexto] = useState('');
  const [busqueda, establecerBusqueda] = useState('');
  const [filtro, establecerFiltro] = useState('');
  const [revision, establecerRevision] = useState(0);
  const [consulta, establecerConsulta] = useState<Consulta>({ clave: '' });
  const [accion, establecerAccion] = useState<'estado' | 'eliminar' | null>(null);
  const [aviso, establecerAviso] = useState('');
  const vigente = useRef(true);
  // Una escritura que termina después de abandonar esta pantalla no debe
  // redirigir al administrador desde el módulo o sesión que abrió después.
  useEffect(() => { vigente.current = true; return () => { vigente.current = false; }; }, []);
  const clave = JSON.stringify([recurso, modo, id, empresaId, pagina, busqueda, filtro, revision]);
  useEffect(() => {
    const controlador = new AbortController();
    async function consultar() {
      try {
        if (modo !== 'lista' && modo !== 'nuevo' && (!id || !/^[1-9]\d*$/.test(id))) throw new ErrorAdministracion('El identificador del registro no es válido.');
        let listado: PaginaRegistros | undefined;
        let registro: RegistroAdministrativo | undefined;
        if (modo === 'lista') {
          const parametros: Record<string, string | number> = { page: pagina, search: busqueda };
          if (empresaId) parametros.empresa_id = empresaId;
          if (filtro !== '') parametros[recurso === 'rutas' ? 'solo_activos' : recurso === 'empresas' ? 'activo' : recurso === 'micros' ? 'estado' : 'estado_operativo'] = filtro;
          listado = await listarRegistros(recurso, parametros, controlador.signal);
        } else if (modo !== 'nuevo') {
          registro = await consultarRegistro(recurso, Number(id), controlador.signal);
          if (empresaId && registro.empresa_id !== empresaId) throw new ErrorAdministracion('El registro no pertenece a la empresa seleccionada.');
        }
        const [rutas, conductores] = recurso === 'micros' && (modo === 'nuevo' || modo === 'editar') && empresaId
          ? await Promise.all([cargarCatalogo('rutas', empresaId, controlador.signal), cargarCatalogo('conductores', empresaId, controlador.signal)]) : [[], []];
        if (!controlador.signal.aborted) establecerConsulta({ clave, pagina: listado, registro, rutas, conductores });
      } catch (error) {
        if (!controlador.signal.aborted) establecerConsulta({ clave, error: errorAdministracion(error).message });
      }
    }
    void consultar();
    return () => controlador.abort();
  }, [clave, recurso, modo, id, empresaId, pagina, busqueda, filtro]);

  if (consulta.clave !== clave) return <p role="status">Cargando {nombresRecursos[recurso].toLowerCase()}…</p>;
  if (consulta.error) return <section className="admin-card admin-form"><h1>No pudimos cargar la información</h1><p role="alert">{consulta.error}</p>
    <button className="admin-button" onClick={() => establecerRevision(actual => actual + 1)}>Reintentar</button><Link to={base}>Volver al listado</Link></section>;
  const registro = consulta.registro;
  const titulo = registro ? tituloRegistro(recurso, registro) : nombresRecursos[recurso];
  const cuenta = registro?.administradores?.find(perfil => perfil.usuario_id === Number(usuarioId))?.usuario;
  const avisoNavegacion = typeof ubicacion.state?.aviso === 'string' ? ubicacion.state.aviso : '';

  async function guardar(datos: Record<string, unknown>) {
    if (modo === 'cuentaNueva' || modo === 'cuentaEditar') {
      if (!registro || (modo === 'cuentaEditar' && (!cuenta || cuenta.rol !== 'admin_empresa'))) throw new ErrorAdministracion('No se pudo verificar la cuenta vinculada.');
      const campos = Object.fromEntries(Object.entries(datos).map(([campo, valor]) => [campo, String(valor)]));
      await guardarCuentaEmpresa(registro.id, campos, cuenta?.id);
      if (!vigente.current) return;
      navegar(`${base}/${registro.id}`, { state: { aviso: 'Cuenta administrativa guardada.' } });
      return;
    }
    if (recurso !== 'empresas') {
      if (!empresaId) throw new ErrorAdministracion('Selecciona una empresa autorizada.');
      datos.empresa_id = empresaId;
    }
    const guardado = await guardarRegistro(recurso, datos, registro?.id);
    if (!vigente.current) return;
    navegar(`${base}/${guardado.id}`, { state: { aviso: 'Cambios guardados en el servidor.' } });
  }

  if (modo === 'nuevo' || modo === 'editar' || modo === 'cuentaNueva' || modo === 'cuentaEditar') {
    const esCuenta = modo === 'cuentaNueva' || modo === 'cuentaEditar';
    if (modo === 'cuentaEditar' && (!cuenta || cuenta.rol !== 'admin_empresa')) return <p role="alert">Esta cuenta administrativa no pertenece a la empresa consultada.</p>;
    return <><PageHeading title={esCuenta ? (cuenta ? 'Editar cuenta administrativa' : 'Crear cuenta administrativa') : `${registro ? 'Editar' : 'Registrar'} · ${nombresRecursos[recurso]}`}
      description={esCuenta ? `Empresa: ${titulo}` : 'Los cambios se guardarán en el servidor.'} />
      <FormularioRegistro key={`${clave}-${usuarioId ?? ''}`} recurso={esCuenta ? 'cuenta' : recurso} registro={esCuenta ? undefined : registro}
        cuenta={cuenta} rutas={consulta.rutas} conductores={consulta.conductores} alGuardar={guardar} cancelar={registro ? `${base}/${registro.id}` : base} /></>;
  }

  if (modo === 'lista') {
    const listado = consulta.pagina!;
    return <><PageHeading title={nombresRecursos[recurso]} description="Información consultada en el servidor." />
      {(aviso || avisoNavegacion) && <p className="admin-pending" role="status">{aviso || avisoNavegacion}</p>}
      <section className="admin-card admin-route-list">
        <div className="admin-list-heading"><h2>Registros disponibles</h2><Link className="admin-button" to={`${base}/nuevo`}>Registrar</Link></div>
        <form className="admin-list-filters" onSubmit={evento => { evento.preventDefault(); establecerPagina(1); establecerBusqueda(texto.trim()); }}>
          <div className="admin-field admin-search-field"><label htmlFor="busqueda-registros">Buscar</label><input id="busqueda-registros" value={texto} onChange={evento => establecerTexto(evento.target.value)} /></div>
          <button className="admin-button admin-outline" type="submit">Buscar</button>
          <div className="admin-field"><label htmlFor="filtro-registros">Estado</label><select id="filtro-registros" value={filtro} onChange={evento => { establecerPagina(1); establecerFiltro(evento.target.value); }}>
            <option value="">Todos</option>
            {recurso === 'empresas' || recurso === 'rutas' ? <><option value="1">Activos</option>{recurso === 'empresas' && <option value="0">Inactivos</option>}</>
              : (recurso === 'micros' ? ['disponible', 'en_recorrido', 'mantenimiento', 'inactivo'] : ['disponible', 'en_recorrido', 'sin_conexion']).map(estado => <option key={estado} value={estado}>{estado.replaceAll('_', ' ')}</option>)}
          </select></div>
        </form>
        {listado.data.length ? <div className="admin-table-wrap"><table className="admin-table admin-routes-table"><caption className="admin-small">{nombresRecursos[recurso]} · Página {listado.meta.current_page}</caption>
          <thead><tr><th scope="col">Registro</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead>
          <tbody>{listado.data.map(fila => <tr key={fila.id}><td><strong>{tituloRegistro(recurso, fila)}</strong><span className="admin-record-key">{fila.ruc ?? fila.usuario?.correo ?? (fila.ruta?.nombre_ruta ? `Ruta: ${fila.ruta.nombre_ruta}` : `ID ${fila.id}`)}</span></td>
            <td>{estadoRegistro(recurso, fila).replaceAll('_', ' ')}</td><td><div className="admin-row-actions"><Link className="admin-button admin-outline" to={`${base}/${fila.id}`}>Ver</Link><Link className="admin-button admin-outline" to={`${base}/${fila.id}/editar`}>Editar</Link></div></td></tr>)}</tbody>
        </table></div> : <p className="admin-empty-state">No hay registros que coincidan. Registra uno o cambia los filtros.</p>}
        <nav className="admin-trazado-herramientas" aria-label="Paginación"><button className="admin-button admin-outline" disabled={pagina <= 1} onClick={() => establecerPagina(actual => actual - 1)}>Anterior</button>
          <span>Página {listado.meta.current_page} de {listado.meta.last_page} · {listado.meta.total} registros</span>
          <button className="admin-button admin-outline" disabled={pagina >= listado.meta.last_page} onClick={() => establecerPagina(actual => actual + 1)}>Siguiente</button></nav>
      </section></>;
  }
  if (!registro) return <p role="alert">No se encontró el registro.</p>;
  const estados = recurso === 'conductores' ? ['disponible', 'en_recorrido', 'sin_conexion'] : recurso === 'micros' ? ['disponible', 'en_recorrido', 'mantenimiento', 'inactivo'] : ['1', '0'];
  const datosDetalle: [string, string | number | undefined | null][] = recurso === 'empresas'
    ? [['RUC', registro.ruc], ['Teléfono', registro.telefono], ['Dirección', registro.direccion]]
    : recurso === 'conductores' ? [['DNI', registro.usuario?.dni], ['Nombres', registro.usuario?.nombre], ['Apellidos', registro.usuario?.apellido], ['Correo', registro.usuario?.correo], ['Teléfono', registro.usuario?.telefono], ['Licencia', registro.licencia_conducir], ['Micro asignado', registro.micro_actual?.placa], ['Cuenta', registro.usuario?.activo ? 'Activa' : 'Inactiva']]
      : recurso === 'micros' ? [['Placa', registro.placa], ['Capacidad', registro.capacidad_pasajeros], ['Ruta', registro.ruta?.nombre_ruta], ['Conductor', registro.conductor_actual?.usuario ? `${registro.conductor_actual.usuario.nombre} ${registro.conductor_actual.usuario.apellido}` : undefined]] : [['Nombre', registro.nombre_ruta]];
  return <><PageHeading title={titulo} description={`Estado: ${estadoRegistro(recurso, registro).replaceAll('_', ' ')}`} />
    {(aviso || avisoNavegacion) && <p className="admin-pending" role="status">{aviso || avisoNavegacion}</p>}
    <section className="admin-card admin-detail"><dl>{datosDetalle.map(([etiqueta, valor]) => <div key={etiqueta}><dt>{etiqueta}</dt><dd>{valor ?? 'Sin asignar'}</dd></div>)}</dl>
      <div className="admin-trazado-herramientas"><Link className="admin-button admin-outline" to={base}>Volver al listado</Link><Link className="admin-button" to={`${base}/${registro.id}/editar`}>Editar</Link>
        <button className="admin-button admin-outline" onClick={() => establecerAccion('estado')}>{recurso === 'conductores' ? 'Cambiar estado operativo' : 'Cambiar estado'}</button>
        <button className="admin-button admin-delete-outline" onClick={() => establecerAccion('eliminar')}>Eliminar</button></div>
      {recurso === 'conductores' && <p className="admin-small admin-muted">El estado operativo no activa ni desactiva la cuenta. Eliminar borra el perfil de conductor; la cuenta de usuario permanece. Primero debe desasignarse su micro.</p>}
    </section>
    {recurso === 'rutas' && registro.trazado_ruta && <section className="admin-card admin-form"><h2>Recorrido guardado</h2><MapaRuta puntos={registro.trazado_ruta.coordinates.map(([longitud, latitud]) => ({ latitud, longitud }))} /></section>}
    {recurso === 'empresas' && <section className="admin-card admin-form"><h2>Cuentas administrativas</h2>
      {registro.administradores?.length ? registro.administradores.map(perfil => <CuentaVinculada key={perfil.id} cuenta={perfil.usuario} enlace={`${base}/${registro.id}/cuentas/${perfil.usuario_id}/editar`} />) : <p>Esta empresa todavía no tiene cuentas administrativas vinculadas.</p>}
      <Link className="admin-button" to={`${base}/${registro.id}/cuentas/nueva`}>Crear cuenta administrativa</Link>
      <p className="admin-small admin-muted">Una empresa con cuentas, rutas, micros o conductores vinculados no puede eliminarse. Puedes desactivarla para conservar su información.</p>
    </section>}
    {accion && <DialogoOperacion titulo={accion === 'estado' ? 'Cambiar estado' : `¿Eliminar ${titulo}?`}
      descripcion={accion === 'estado' ? `Registro: ${titulo}. ${recurso === 'conductores' ? 'Esto cambia la disponibilidad operativa, sin modificar su cuenta.' : 'Confirma el nuevo estado del registro.'}`
        : recurso === 'conductores' ? 'Se eliminará definitivamente el perfil de conductor. La cuenta de usuario se conserva. Debes desasignar el micro antes de eliminar.' : 'Se eliminará definitivamente este registro. La operación no se puede deshacer y puede bloquearse si existen dependencias.'}
      estados={accion === 'estado' ? estados.map(valor => ({ valor, nombre: valor === '1' ? 'Activo' : valor === '0' ? 'Inactivo' : valor.replaceAll('_', ' ') })) : undefined}
      estadoInicial={recurso === 'empresas' || recurso === 'rutas' ? registro.activo ? '1' : '0' : estadoRegistro(recurso, registro)}
      alCerrar={() => establecerAccion(null)} alConfirmar={async estado => {
        if (accion === 'eliminar') { await eliminarRegistro(recurso, registro.id); if (vigente.current) navegar(base, { state: { aviso: 'Registro eliminado en el servidor.' } }); }
        else { await cambiarEstadoRegistro(recurso, registro.id, recurso === 'rutas' || recurso === 'empresas' ? estado === '1' : estado); if (!vigente.current) return; establecerAviso('Estado actualizado en el servidor.'); establecerAccion(null); establecerRevision(actual => actual + 1); }
      }} />}
  </>;
}

function CuentaVinculada({ cuenta, enlace }: { cuenta?: CuentaAdministrativa; enlace: string }) {
  if (!cuenta) return <p>No se pudo consultar la identidad de esta cuenta.</p>;
  return <div className="admin-cuenta-vinculada"><p><strong>{cuenta.nombre} {cuenta.apellido}</strong><br />{cuenta.correo}<br />{cuenta.activo ? 'Cuenta activa' : 'Cuenta inactiva'}</p><Link className="admin-button admin-outline" to={enlace}>Editar cuenta</Link></div>;
}
