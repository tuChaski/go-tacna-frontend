/** Orquesta las vistas reales de listado, consulta y escritura de un recurso.
 * Las consultas se cancelan al navegar; su clave impide mostrar datos de la
 * empresa o página anterior. Las escrituras se confirman antes de navegar.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { cargarCatalogo, consultarRegistro, ErrorAdministracion, errorAdministracion, guardarCuentaEmpresa, guardarRegistro, listarRegistros } from '../../services/administracion';
import { nombresRecursos, opcionesEstadoOperativo, presentacionEstado, tituloRegistro } from './datos-administracion';
import type { CuentaAdministrativa, PaginaRegistros, Recurso, RegistroAdministrativo } from './datos-administracion';
import { PageHeading } from './componentes/PageHeading';
import { FormularioRegistro } from './componentes/FormularioRegistro';
import { MapaRuta } from './rutas/MapaRuta';
import { AccionesRegistro } from './componentes/AccionesRegistro';

const etiquetas: Record<Recurso, { singular: string; listado: string; buscar: string }> = {
  empresas: { singular: 'Empresa', listado: 'Empresas registradas', buscar: 'Razón social o RUC' },
  rutas: { singular: 'Ruta', listado: 'Rutas registradas', buscar: 'Nombre de la ruta' },
  micros: { singular: 'Micro', listado: 'Micros registrados', buscar: 'Placa del micro' },
  conductores: { singular: 'Conductor', listado: 'Conductores registrados', buscar: 'Nombre, documento o correo' },
};

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
  const [aviso, establecerAviso] = useState('');
  const vigente = useRef(true);
  const focoRegistro = useRef<number | 'busqueda' | null>(null);
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

  // Tras refrescar una acción de fila, devuelve el foco al registro o al filtro
  // si la fila ya no está (por eliminación o por el filtro de estado activo).
  useEffect(() => {
    if (modo !== 'lista' || consulta.clave !== clave || consulta.error || focoRegistro.current === null) return;
    const objetivo = focoRegistro.current;
    focoRegistro.current = null;
    const elemento = typeof objetivo === 'number' ? document.getElementById(`estado-${recurso}-${objetivo}`) : null;
    (elemento ?? document.getElementById('busqueda-registros'))?.focus();
  }, [consulta.clave, consulta.error, clave, recurso, modo]);

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
    navegar(`${base}/${guardado.id}`, { state: { aviso: recurso === 'conductores' && !registro
      ? 'Conductor y cuenta creados. Entrega al conductor el correo y la contraseña que ingresaste para que pueda iniciar sesión.'
      : 'Cambios guardados en el servidor.' } });
  }

  if (modo === 'nuevo' || modo === 'editar' || modo === 'cuentaNueva' || modo === 'cuentaEditar') {
    const esCuenta = modo === 'cuentaNueva' || modo === 'cuentaEditar';
    if (modo === 'cuentaEditar' && (!cuenta || cuenta.rol !== 'admin_empresa')) return <p role="alert">Esta cuenta administrativa no pertenece a la empresa consultada.</p>;
    return <><PageHeading title={esCuenta ? (cuenta ? 'Editar cuenta administrativa' : 'Crear cuenta administrativa') : recurso === 'conductores' ? `${registro ? 'Editar' : 'Registrar'} conductor` : `${registro ? 'Editar' : 'Registrar'} · ${nombresRecursos[recurso]}`}
      description={esCuenta ? `Empresa: ${titulo}` : recurso === 'conductores' && !registro ? 'Completa sus datos y define las credenciales que usará para iniciar sesión.' : 'Los cambios se guardarán en el servidor.'} />
      <FormularioRegistro key={`${clave}-${usuarioId ?? ''}`} recurso={esCuenta ? 'cuenta' : recurso} registro={esCuenta ? undefined : registro}
        cuenta={cuenta} rutas={consulta.rutas} conductores={consulta.conductores} alGuardar={guardar} cancelar={registro ? `${base}/${registro.id}` : base} /></>;
  }

  if (modo === 'lista') {
    const listado = consulta.pagina!;
    return <><PageHeading title={nombresRecursos[recurso]} description="Información consultada en el servidor." />
      {(aviso || avisoNavegacion) && <p className="admin-pending" role="status">{aviso || avisoNavegacion}</p>}
      <section className="admin-card admin-route-list admin-management-list">
        <div className="admin-list-heading"><h2>{etiquetas[recurso].listado}</h2><Link className="admin-button" to={`${base}/nuevo`}><Plus size={18} aria-hidden="true" />Registrar {etiquetas[recurso].singular.toLowerCase()}</Link></div>
        <form className="admin-list-filters" onSubmit={evento => { evento.preventDefault(); establecerPagina(1); establecerBusqueda(texto.trim()); }}>
          <div className="admin-field admin-search-field"><label htmlFor="busqueda-registros">Buscar {etiquetas[recurso].singular.toLowerCase()}</label>
            <div className="admin-input-wrap"><Search size={18} aria-hidden="true" /><input id="busqueda-registros" placeholder={etiquetas[recurso].buscar} value={texto} onChange={evento => establecerTexto(evento.target.value)} /></div></div>
          <button className="admin-button admin-outline" type="submit">Buscar</button>
          <div className="admin-field"><label htmlFor="filtro-registros">Estado</label><select id="filtro-registros" value={filtro} onChange={evento => { establecerPagina(1); establecerFiltro(evento.target.value); }}>
            <option value="">Todos</option>
            {recurso === 'empresas' || recurso === 'rutas' ? <><option value="1">Activos</option>{recurso === 'empresas' && <option value="0">Inactivos</option>}</>
              : opcionesEstadoOperativo(recurso).map(estado => <option key={estado.valor} value={estado.valor}>{estado.nombre}</option>)}
          </select></div>
        </form>
        {listado.data.length ? <div className="admin-table-wrap"><table className="admin-table admin-routes-table admin-management-table"><caption className="admin-small">{nombresRecursos[recurso]} · Página {listado.meta.current_page}</caption>
          <thead><tr><th scope="col">{etiquetas[recurso].singular}</th><th scope="col">{recurso === 'micros' || recurso === 'conductores' ? 'Estado operativo' : 'Estado'}</th><th scope="col">Acciones</th></tr></thead>
          <tbody>{listado.data.map(fila => <tr key={fila.id}><td><strong className="admin-record-title">{tituloRegistro(recurso, fila)}</strong><span className="admin-record-key">{recurso === 'empresas' ? `RUC: ${fila.ruc ?? 'Sin registrar'}` : fila.usuario?.correo ?? (fila.ruta?.nombre_ruta ? `Ruta: ${fila.ruta.nombre_ruta}` : `ID ${fila.id}`)}</span></td>
            <td><span className={`admin-status-badge admin-status-${presentacionEstado(recurso, fila).tono}`}>{presentacionEstado(recurso, fila).nombre}</span></td>
            <td><AccionesRegistro recurso={recurso} registro={fila} base={base} alCompletar={({ eliminado, aviso: mensaje }) => {
              establecerAviso(mensaje);
              focoRegistro.current = eliminado ? 'busqueda' : fila.id;
              if (eliminado && listado.data.length === 1 && pagina > 1) establecerPagina(actual => actual - 1);
              else establecerRevision(actual => actual + 1);
            }} /></td></tr>)}</tbody>
        </table></div> : <p className="admin-empty-state">No hay registros que coincidan. Registra uno o cambia los filtros.</p>}
        <nav className="admin-trazado-herramientas" aria-label="Paginación"><button className="admin-button admin-outline" disabled={pagina <= 1} onClick={() => establecerPagina(actual => actual - 1)}>Anterior</button>
          <span>Página {listado.meta.current_page} de {listado.meta.last_page} · {listado.meta.total} registros</span>
          <button className="admin-button admin-outline" disabled={pagina >= listado.meta.last_page} onClick={() => establecerPagina(actual => actual + 1)}>Siguiente</button></nav>
      </section></>;
  }
  if (!registro) return <p role="alert">No se encontró el registro.</p>;
  const datosDetalle: [string, string | number | undefined | null][] = recurso === 'empresas'
    ? [['RUC', registro.ruc], ['Teléfono', registro.telefono], ['Dirección', registro.direccion]]
    : recurso === 'conductores' ? [['DNI', registro.usuario?.dni], ['Nombres', registro.usuario?.nombre], ['Apellidos', registro.usuario?.apellido], ['Correo', registro.usuario?.correo], ['Teléfono', registro.usuario?.telefono], ['Licencia', registro.licencia_conducir], ['Micro asignado', registro.micro_actual?.placa], ['Cuenta', registro.usuario?.activo ? 'Activa' : 'Inactiva']]
      : recurso === 'micros' ? [['Placa', registro.placa], ['Capacidad', registro.capacidad_pasajeros], ['Ruta', registro.ruta?.nombre_ruta], ['Conductor', registro.conductor_actual?.usuario ? `${registro.conductor_actual.usuario.nombre} ${registro.conductor_actual.usuario.apellido}` : undefined]] : [['Nombre', registro.nombre_ruta]];
  return <><PageHeading title={titulo} description={`${recurso === 'micros' || recurso === 'conductores' ? 'Estado operativo' : 'Estado'}: ${presentacionEstado(recurso, registro).nombre}`} />
    {(aviso || avisoNavegacion) && <p className="admin-pending" role="status">{aviso || avisoNavegacion}</p>}
    <section className="admin-card admin-detail"><dl>{datosDetalle.map(([etiqueta, valor]) => <div key={etiqueta}><dt>{etiqueta}</dt><dd>{valor ?? 'Sin asignar'}</dd></div>)}</dl>
      <div className="admin-trazado-herramientas"><Link className="admin-button admin-outline" to={base}>Volver al listado</Link><Link className="admin-button" to={`${base}/${registro.id}/editar`}>Editar</Link></div>
      {recurso === 'conductores' && <p className="admin-small admin-muted">El estado operativo no activa ni desactiva la cuenta. Eliminar borra el perfil de conductor; la cuenta de usuario permanece. Primero debe desasignarse su micro.</p>}
    </section>
    {recurso === 'rutas' && registro.trazado_ruta && <section className="admin-card admin-form"><h2>Recorrido guardado</h2><MapaRuta puntos={registro.trazado_ruta.coordinates.map(([longitud, latitud]) => ({ latitud, longitud }))} /></section>}
    {recurso === 'empresas' && <section className="admin-card admin-form"><h2>Cuentas administrativas</h2>
      {registro.administradores?.length ? registro.administradores.map(perfil => <CuentaVinculada key={perfil.id} cuenta={perfil.usuario} enlace={`${base}/${registro.id}/cuentas/${perfil.usuario_id}/editar`} />) : <p>Esta empresa todavía no tiene cuentas administrativas vinculadas.</p>}
      <Link className="admin-button" to={`${base}/${registro.id}/cuentas/nueva`}>Crear cuenta administrativa</Link>
      <p className="admin-small admin-muted">Una empresa con cuentas, rutas, micros o conductores vinculados no puede eliminarse. Puedes desactivarla para conservar su información.</p>
    </section>}
  </>;
}

function CuentaVinculada({ cuenta, enlace }: { cuenta?: CuentaAdministrativa; enlace: string }) {
  if (!cuenta) return <p>No se pudo consultar la identidad de esta cuenta.</p>;
  return <div className="admin-cuenta-vinculada"><p><strong>{cuenta.nombre} {cuenta.apellido}</strong><br />{cuenta.correo}<br />{cuenta.activo ? 'Cuenta activa' : 'Cuenta inactiva'}</p><Link className="admin-button admin-outline" to={enlace}>Editar cuenta</Link></div>;
}
