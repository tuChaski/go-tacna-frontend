# T059 — Panel administrativo: Empresas, Rutas, Conductores y Micros

Rama: `feature/T059-crud-admin`, creada desde `origin/develop`.

## Estado actual: integración con Laravel — 23/10/2026

El panel después de `/login` consume el gateway y la base de datos reales, con backend/main `b7c5aa2` e infraestructura/develop `193b72d`. Se mantuvo el maquetado `/admin/preview` como referencia de desarrollo. Los apartados de maquetado posteriores son históricos; los avisos de «API pendiente» de esa vista no corresponden al panel autenticado.

### Operaciones conectadas

| Perfil | Recurso y comportamiento |
|---|---|
| Administrador general | Empresas: listado, búsqueda, filtros, paginación, registro, detalle, edición, activar/desactivar y eliminación con bloqueo por dependencias. |
| Administrador general | Cuentas de empresa: creación y edición desde el detalle de la empresa; rol `admin_empresa` fijo, sin selector de privilegios. Se muestran todas las cuentas vinculadas. Contraseña vacía en edición conserva la actual. |
| Administrador de empresa | Rutas: listado, búsqueda y filtro de activas, registro/edición de nombre y geometría, consulta del recorrido, activar/desactivar y eliminar si no tiene micros. |
| Administrador de empresa | Conductores: alta de cuenta + perfil mediante `/conductores`, listado, detalle, edición de licencia, cambio de estado operativo y eliminación del perfil si no tiene micro. La cuenta de usuario permanece al borrar el perfil. |
| Administrador de empresa | Micros: alta, consulta, edición, placa/capacidad, ruta y conductor opcionales, estados y eliminación. Los selectores consultan todas las páginas de su empresa y deshabilitan conductores ocupados o cuentas inactivas para nuevas asignaciones. Un micro en recorrido no permite cambiar sus asignaciones. |

El alcance se obtiene de los perfiles confirmados de sesión. Si hay varias empresas se exige seleccionar una; una sola se selecciona por su ID autorizado. La API vuelve a verificar los permisos y relaciones. El administrador general no recibe en este panel controles para operar rutas/flota de las empresas, según el alcance acordado.

Empresa y cuenta son dos recursos distintos: se guarda primero la empresa y desde su detalle se crea la cuenta. Si falla el segundo paso, la empresa sigue disponible y no se repite su alta. No se anuncia que la cuenta fue creada hasta recibir confirmación del servidor. No se registran contraseñas en consola, archivos ni almacenamiento del navegador.

### Límite de backend confirmado y autorizado por Alex

El administrador de empresa todavía no tiene permisos para editar DNI, nombres, teléfono, correo o contraseña de una cuenta de conductor, ni para activar/desactivar esa cuenta. Alex autorizó conectar lo disponible y dejar esas acciones pendientes de ampliación de API por su compañero. La edición conectada muestra la identidad y permite cambiar la licencia. `disponible`/`en_recorrido`/`sin_conexion` son estados operativos, distintos de `usuario.activo`. Este incremento tampoco implementa desvinculación/eliminación de cuentas administrativas, gestión de pasajeros ni monitoreo T060/refresco T102.

### Organización del código conectado

- `PanelAdministracion.tsx`: navegación autenticada y selección de empresa de sesión.
- `GestionRecurso.tsx`: listados paginados, consulta de detalle, navegación tras respuestas y alcance de la empresa seleccionada. Cancela consultas al navegar y evita presentar datos de una solicitud anterior.
- `datos-administracion.ts`: contratos de lectura y etiquetas de los recursos, sin credenciales.
- `componentes/FormularioRegistro.tsx`: campos publicados para cada operación, validación local, errores por campo, preservación de datos y bloqueo de doble envío; reutiliza `EditorTrazadoRuta`.
- `componentes/DialogoOperacion.tsx`: confirmación de estado o eliminación, foco accesible y errores de servidor sin cerrar prematuramente.
- `src/services/administracion.ts`: HTTP, paginación de catálogos, respuestas confirmadas y mensajes controlados para red/401/403/404/409/422/429/500. No reintenta escrituras automáticamente.
- `RutasAcceso.tsx`: monta el panel después de verificar sesión y rol de T056. El panel y el editor de mapas también se incluyen en producción.

Los formularios conectados comparten componentes para evitar cuatro implementaciones de envío y manejo de errores. Los archivos de referencia existentes permanecen separados de los registros reales; no se usan IDs de ejemplos en peticiones a la API.

### Verificación de integración

- `npm run build` y `npm run lint`: pasan. Se mantiene la advertencia previa del bundle de la landing. `test:auth`: 18 casos; `test:rutas`: ocho casos, todos pasan.
- API local con PostgreSQL: 36 solicitudes verificadas antes de la limpieza. Alta/edición/consulta de empresa, cuenta administrativa, ruta, conductor y micro; persistencia de la geometría; desactivación/reactivación; duplicados 422; aislamiento 403; asignación uno a uno; borrado bloqueado 409 por dependencias o recorrido; logout y rechazo 401 del token invalidado. La limpieza eliminó solo los IDs ficticios de esa ejecución, en orden inverso de dependencias; no se ejecutaron migraciones ni seeders.
- Navegador: empresa creada y teléfono editado confirmado al recargar; alta/edición de cuenta administrativa y login con ella; ruta guardada en PostGIS y nombre editado; conductor creado y licencia editada confirmada al recargar; micro con ruta/conductor, capacidad editada y estado cambiado/reactivado, confirmados al recargar.
- UI: placa duplicada con respuesta 422, datos conservados y foco en placa; conductor ocupado deshabilitado; búsqueda sin coincidencias. Gateway local detenido brevemente: error de consulta con Reintentar; tras restaurarlo, listado recuperado. No se reintentaron escrituras durante esa caída.
- Permanecen para inspección los registros ficticios identificados como `PRUEBA INTERFAZ T059`, su cuenta administrativa, conductor, ruta y micro `UI-T059-001`. Los de la prueba automática fueron eliminados. No son datos de una empresa real.

La eliminación se verificó contra la API con datos creados por la prueba automática; la revisión de navegador no constituye una batería completa de todas las combinaciones ni pruebas con usuarios. Confirmar T059 con el equipo considerando las operaciones de cuenta de conductor pendientes; no se cierra automáticamente la issue.

Para repetir la prueba de integración en una base local de desarrollo, desde frontend:

```powershell
$env:GOTACNA_PROBAR_ESCRITURAS = '1'
$env:GOTACNA_ADMIN_CORREO = '<correo del administrador general local>'
$env:GOTACNA_ADMIN_CLAVE = '<contraseña local>'
npm run test:crud
```

`GOTACNA_API` es opcional y por defecto apunta a `http://127.0.0.1:8001/api/v1`. El script rechaza hosts que no sean loopback. Estas variables son de la prueba Node, no `VITE_*`; no añadir credenciales a `.env` versionados.

## Registro histórico del maquetado

## Actualización de Rutas — 23/10/2026

Se completa el maquetado existente de Rutas con nombre y editor de trazado. Por decisión de Alex se retiran «Origen y destino» y los nombres de referencias inicial/final del formulario, detalle, listado y confirmaciones: no existen en `RutaRequest`/`RutaResource` de backend/main `b7c5aa2`, confirmado nuevamente en GitHub. No se añaden columnas ni endpoints para conservarlos.

- Nombre obligatorio, máximo 180 caracteres, y al menos dos puntos válidos en orden. Se rechazan coordenadas no finitas/fuera de rango y segmentos consecutivos sin desplazamiento. Se permiten recorridos que vuelven al inicio.
- Modo explícito para marcar puntos en el mapa. También pueden añadirse y corregirse mediante latitud/longitud con teclado, reordenarse, quitarse, limpiarse y recuperarse con Deshacer. Los controles de coordenadas no envían el formulario al pulsar Enter.
- Mapa de consulta en el detalle y copia de los puntos al editar. El ejemplo tiene cuatro puntos ficticios en Tacna; no representa una línea real verificada.
- Los puntos describen el recorrido, no paraderos obligatorios. La línea une puntos manuales: no hay ajuste automático a calles, cálculo de rutas, geocodificación ni seguimiento GPS.
- El guardado sigue pendiente de integración. La empresa se obtendrá del contexto autorizado al construir el payload; el módulo no asigna una empresa real a partir del ejemplo.

### Archivos y dependencias

Los componentes existentes `RouteForm`, `RouteContext`, `RouteDetail`, `RouteList` y sus archivos de referencia se actualizan sin duplicar el módulo. Los nuevos archivos están en `src/modulos/administracion/rutas/`, con nombres en español y comentarios sobre su responsabilidad:

- `MapaRuta.tsx`: presentación del mapa, eventos de selección, encuadre y adaptación al tamaño del contenedor. Incluye aviso y reintento si falla la carga de teselas.
- `EditorTrazadoRuta.tsx`: copia temporal, historial de cambios y alternativa al ratón para editar puntos.
- `trazado-ruta.ts`: modelo y validación geométrica; `crearGeoJson` produce `{ type: 'LineString', coordinates: [[longitud, latitud], ...] }` sin alterar los puntos originales. La futura integración lo utilizará como `trazado_ruta`.
- `pruebas/rutas.test.mjs`: regresiones del contrato y la conversión de coordenadas. Ejecutar `npm run test:rutas`.

Leaflet y React Leaflet ya estaban instalados; se agrega solo `@types/leaflet` como dependencia de desarrollo y su tipo transitivo GeoJSON. Se consultaron la [API de React Leaflet](https://react-leaflet.js.org/docs/api-map/) y la [referencia de Leaflet](https://leafletjs.com/reference.html). El fondo usa teselas visibles bajo demanda de OpenStreetMap con atribución, caché del navegador y sin precarga/offline, siguiendo su [política de teselas](https://operations.osmfoundation.org/policies/tiles/). Requiere conexión a ese proveedor y revisar su capacidad/condiciones al desplegar.

### Verificación de Rutas

- `npm run build` y `npm run lint`: pasan; sigue la advertencia previa del bundle de la landing. `npm run test:rutas`: ocho casos pasan (orden GeoJSON, copia sin mutación, trazado incompleto, límites/no finitos, puntos repetidos, recorrido circular, nombre y longitud máxima).
- Navegador: formulario vacío y foco en nombre; nombre válido sin trazado y foco en editor; dos puntos marcados sobre el mapa; coordenada fuera de rango rechazada; tercer punto añadido con Enter; reordenamiento, edición, quitar, limpiar y Deshacer; envío válido con aviso explícito de API pendiente.
- Navegación entre listado, detalle y edición con cuatro puntos precargados; el ejemplo conserva sus datos tras cancelar. Mapas de consulta y edición cargaron el fondo de OpenStreetMap.
- Revisión a 1440 × 1080 y 390 × 844; sin desbordamiento horizontal en el formulario. Capturas fuera de Git. El aviso de fallo/reintento del proveedor existe, pero no se simuló una caída de sus servidores.

Estas pruebas verifican la interfaz y geometría local; no comprueban persistencia, permisos entre empresas ni todas las condiciones de red. Reactivar, listados paginados y errores de API se completarán en la integración. T059 sigue abierta.

## Actualización de Empresas — 23/10/2026

Se completan los campos de registro, edición y detalle de Empresa y de su cuenta administrativa. Este incremento es maquetado y validación local; no llama a la API ni guarda en la base de datos. Las revisiones anteriores de este documento son históricas.

- Empresa: razón social, RUC, teléfono y dirección.
- Administrador: DNI, nombres, apellidos, teléfono, correo y contraseña inicial. En edición, contraseña vacía conserva la actual; una contraseña nueva exige al menos ocho caracteres. El detalle nunca muestra contraseñas.
- Dos grupos accesibles de campos, resumen de identidad y diseño adaptable. Cancelar descarta la copia temporal. Un envío válido informa que la integración sigue pendiente, sin anunciar un guardado.
- Límites contrastados con `EmpresaRequest` y `UsuarioRequest` de backend/main `b7c5aa2`, también confirmado en GitHub. RUC: exactamente 11 caracteres; DNI: máximo 20; razón social: 180; nombres/apellidos: 120; teléfonos: 30; dirección: 255; correo: 150. El contrato no exige patrones numéricos de RUC/DNI: no se añade verificación tributaria ni de identidad por suposición. La unicidad depende del servidor.

### Organización y comentarios

La [guía de frontend](https://github.com/tuChaski/go-tacna-docs/blob/develop/go-tacna-frontend.md) pide comprobar el árbol existente y separar UI, servicios y dominio. Se conserva `src/modulos/administracion/empresas/`, ya existente:

- `FormularioEmpresa.tsx`: estado temporal, grupos de campos, ayudas, validación y foco. Extrae el formulario de `AdminPreview.tsx`.
- `formulario-empresa.ts`: modelo local, etiquetas y reglas compartidas. Sustituye `company-form.ts`, ya sin consumidores.
- `empresa-referencia.ts`: ejemplo ficticio compartido por listado, detalle y edición, sin contraseña almacenada.
- `AdminPreview.tsx`: mantiene el enrutamiento, listado y detalle; el detalle reutiliza las etiquetas del formulario.
- `admin.css`: reglas acotadas para los grupos de Empresa y la adaptación de columnas.

Los comentarios explican responsabilidades, límites de la vista previa y tratamiento de contraseñas. La guía conserva referencias antiguas a un contrato vacío; para los campos se usaron las validaciones actuales del backend.

### Verificación de este incremento

- `npm run build` y `npm run lint`: pasan. Se mantiene la advertencia previa de tamaño del bundle de la landing.
- 26 aserciones locales ejecutadas con Node: presencia y límites de los nueve campos de identidad/contacto, RUC, correo y contraseña en alta/edición. No se añadió una dependencia de pruebas.
- Navegador: envío vacío con diez errores y foco en razón social; datos ficticios completos con aviso de guardado pendiente; RUC corto, correo inválido y contraseña corta rechazados; cancelación; edición precargada con contraseña vacía admitida; mostrar/ocultar; detalle con todos los campos públicos.
- Formulario revisado a 1440 × 1080 y 390 × 844; sin desbordamiento horizontal en móvil. Capturas fuera del repositorio. No equivale a probar todos los dispositivos ni a pruebas con usuarios.

### Lo que sigue pendiente

Conectar Empresa, Usuario y su vínculo administrativo como recursos distintos, gestionar fallos parciales y mensajes de servidor, y contemplar cuentas existentes o varios administradores sin inferirlos a partir del único ejemplo visual. Completar búsqueda, filtros, paginación y reactivación de Empresas durante la integración. T059 sigue abierta; los otros módulos y el acceso autenticado al panel no cambian en este incremento.

Revisión histórica: [matriz de casos y pendientes de cierre — 16/10/2026](./revision-t059.md).

## Revisar las pantallas

Desde la raíz del frontend:

```sh
npm ci
npm run dev
```

Abrir `http://localhost:5173/admin/preview` (o el puerto que indique Vite).

Para el administrador de empresa: `http://localhost:5173/admin/preview/empresa`.
Para Rutas: `http://localhost:5173/admin/preview/empresa/rutas`.
Para Conductores: `http://localhost:5173/admin/preview/empresa/conductores`.
Para Micros: `http://localhost:5173/admin/preview/empresa/micros`.
El enlace superior permite cambiar de perfil para revisar las pantallas; no cambia una sesión autenticada.

La vista previa se carga exclusivamente en desarrollo mediante `import.meta.env.DEV`. En la compilación de producción continúa la aplicación existente; esta vista no constituye un panel autenticado ni un mecanismo de autorización.

## Incluido en este incremento

- Inicio de administración general.
- Listado y detalle de una empresa ficticia de referencia, tomados de T053.
- Formularios de registro y edición con ingreso libre de datos.
- Campos obligatorios, formato básico de correo, enfoque del primer error y mostrar/ocultar contraseña.
- Cancelación de formulario y navegación entre pantallas.
- Diálogo de estado con foco modal, cierre por Cancelar o Escape y mensaje de integración pendiente.
- Diseño adaptable, fuente Inter instalada localmente e iconos originales de Figma.
- Inicio del administrador de empresa y navegación independiente para sus Rutas.
- Rutas: búsqueda por nombre/recorrido, filtro de estado, estado sin coincidencias, detalle, registro y edición.
- Validación de los cuatro campos de ruta y resumen del recorrido durante la edición.
- Confirmaciones separadas para desactivar y eliminar definitivamente una ruta, desde listado y detalle.
- Diseño de Rutas adaptado de T053: iconos de `lucide-react` ya instalado y resumen textual de referencias. Figma es una guía, según la indicación de Alex.
- Conductores: listado con búsqueda por nombre (con o sin tildes), documento o correo; filtro de estado y mensaje sin coincidencias.
- Registro, detalle y edición de conductor con nombre completo, documento y correo; contraseña inicial obligatoria al crear y cambio opcional al editar.
- Mostrar/ocultar contraseña, enfoque del primer campo inválido y resumen contextual que recuerda la entrega de credenciales por la empresa.
- Diálogos independientes de desactivación y eliminación definitiva del conductor, sin cambios reales.

Los ejemplos son inmutables. No se escriben datos en `localStorage`, no se llama a endpoints supuestos y no se informa que un registro se guardó. Los valores del formulario solo existen durante la edición y se descartan al salir. Un intento válido de guardar o desactivar muestra que la API sigue pendiente.

En edición, la contraseña comienza vacía y se presenta como cambio opcional; no se carga ninguna contraseña existente.

## Eliminación de rutas acordada con Alex

«Eliminar» representa **borrado definitivo**, separado de «Desactivar», que conserva información. El diálogo identifica la ruta, explica la consecuencia y permite cancelar con botón o Escape. El foco inicial está en Cancelar y se devuelve al botón de origen al cerrar.

En esta fase, confirmar solo muestra que falta la API y no elimina el ejemplo. El backend deberá definir las restricciones por micros asociados, permisos y demás dependencias antes de habilitar la operación real. En el avance inicial se añadió a Rutas; el 16/10 se amplió a Empresas con autorización de Alex.

## Organización para revisión del código

La guía actual de frontend confirma la aplicación en la raíz y pide revisar `src/` antes de crear módulos. No impone una carpeta de administración ni nombres en inglés para los módulos nuevos. Por indicación de Alex, el código de T059 se organiza en `src/modulos/administracion/`: `componentes/`, `rutas/`, `conductores/` y `recursos/`. Se trasladó el avance previo desde `src/features/admin/`, actualizando imports y conservando las URL de revisión. Las carpetas existentes de autenticación y servicios permanecen bajo las convenciones del proyecto.

- `AdminPreview.tsx`: navegación de revisión e interfaz existente de Empresas.
- `CompanyHome.tsx`: inicio del administrador de empresa.
- `componentes/`: título accesible y aviso compartido de integración pendiente.
- `rutas/RouteList.tsx`: listado, búsqueda y filtros de la referencia.
- `rutas/RouteForm.tsx`: registro y edición; estado temporal del formulario.
- `rutas/route-form.ts`: tipos, definición de campos y validación de presencia.
- `rutas/route-reference.ts`: ejemplo inmutable y rutas de navegación de la vista previa.
- `rutas/RouteDetail.tsx`: consulta de datos y acceso a las acciones.
- `rutas/RouteContext.tsx`: resumen textual; no representa coordenadas geográficas.
- `rutas/RouteActionDialog.tsx`: confirmaciones, foco modal y mensaje pendiente.
- `admin.css`: estilos limitados a la vista administrativa, con secciones comentadas.
- `conductores/formulario-conductor.ts`: tipos locales, definición de campos y validaciones.
- `conductores/conductor-referencia.ts`: registro ficticio sin contraseña y normalización de búsqueda.
- `conductores/ListadoConductores.tsx`: búsqueda, filtros, tabla adaptable y acceso a acciones.
- `conductores/FormularioConductor.tsx`: registro/edición y estado temporal del formulario.
- `conductores/DetalleConductor.tsx`: consulta del registro sin exponer contraseñas.
- `conductores/ContextoConductor.tsx`: instrucciones de credenciales y asignación desde Micros.
- `conductores/DialogoConductor.tsx`: confirmación de estado/borrado, foco y aviso pendiente.

Los comentarios explican los límites con la API, las reglas de validación y las decisiones de accesibilidad. El modelo del formulario no pretende definir el contrato del backend.

## Referencia del backend e integración pendiente

Se consultaron GitHub y las guías del proyecto antes de implementar Conductores:

- [Guía de frontend](https://github.com/tuChaski/go-tacna-docs/blob/1505e1876c327f36fd184ff26958d188130299d2/guias/proyectos/go-tacna-frontend.md): aplicación en la raíz; UI, servicios, sesión y reglas de dominio separados; consumir contratos confirmados.
- [Guía de backend-core](https://github.com/tuChaski/go-tacna-docs/blob/1505e1876c327f36fd184ff26958d188130299d2/guias/proyectos/gotacna-backend-core.md): PostgreSQL/PostGIS previstos; persistencia y reglas a cargo de Laravel.
- [Migraciones publicadas del core](https://github.com/tuChaski/go-tacna-backend/tree/24d437d5b657d4b9fa624284f0fb3d8a96b2201b/gotacna-backend-core/database/migrations): solo base de Laravel (`users`, sesiones, restablecimiento, caché y trabajos). No hay migraciones de empresas, conductores o micros en ese estado de `main`.
- [ERD conceptual](https://github.com/tuChaski/go-tacna-docs/blob/1505e1876c327f36fd184ff26958d188130299d2/diagramas/fuente/erd.mmd): relaciona conductor con usuario, micro y ruta. Es referencia conceptual, no esquema implementado ni contrato aprobado del CRUD.
- [OpenAPI revisado](https://github.com/tuChaski/go-tacna-docs/blob/1505e1876c327f36fd184ff26958d188130299d2/contratos/openapi.yaml): `paths` y `schemas` vacíos. No se añaden endpoints ni payloads supuestos.

Antes de conectar Conductores deben confirmarse: identificadores y nombres de campos, empresa obtenida de la sesión, formatos de documento, unicidad de correo/documento, política de contraseña, errores de validación y efecto de eliminar/desactivar sobre la cuenta y el micro asociado. El frontend no debe inferir borrado en cascada ni asignaciones.

El nombre completo, documento, correo y contraseña inicial proceden del prototipo T053. El formulario conserva estos nombres locales hasta definir un adaptador al contrato real. No se almacenan contraseñas en el ejemplo, archivos, consola ni almacenamiento del navegador.

## Pendiente para completar T059

- Integración con T029, T030 y T031, y definición del contrato real.
- Datos de la sesión autenticada, roles y aislamiento por empresa comprobados por el servidor.
- Listados reales y estados de carga, vacíos y errores del servicio.
- Guardado, edición, desactivación, reactivación y eliminación definitiva de rutas, conductores y micros con persistencia real.
- Unicidad, políticas de contraseñas y formatos oficiales de documentos acordados con la API.
- Asignación conductor–micro, bloqueos por dependencias y comprobación de persistencia al recargar.

El login completo corresponde a T056; la recepción por WebSocket corresponde a T060. Este incremento no declara completada T059.

## Verificación local — 14/10/2026

- `npm run build`: pasa. La landing existente produce una advertencia por el tamaño de su bundle.
- `npx eslint src/main.tsx src/modulos/administracion`: pasa.
- `npm run lint`: queda un error previo de `react-refresh/only-export-components` en `src/context/AuthContext.tsx:68`; su corrección está en el PR de T055 pendiente de integración.
- Revisión en navegador: inicio/listado/detalle/registro/edición; campos vacíos y correo inválido; contraseña visible/oculta; cancelación; apertura y cierre del diálogo y mensaje de estado pendiente; diseño de escritorio y móvil.
- Rutas: navegación desde inicio de empresa; búsqueda sin coincidencias y limpieza de filtros; filtro de inactivas; cuatro errores en formulario vacío y foco en el primero; resumen actualizado al escribir; formulario válido sin persistencia; detalle y edición precargada.
- Diálogos de rutas: confirmación de eliminación y desactivación sin mutar el ejemplo; Cancelar/Escape; foco inicial en Cancelar y restauración al botón de origen.
- Comprobación visual de Rutas en escritorio (1440 × 1080) y móvil (390 × 844 solicitado); sin desbordamiento horizontal de la página. No se observaron errores de consola en el recorrido revisado.

Se retiraron dos imports sin uso (`Navigation` y `ShieldCheck`) de la landing para desbloquear TypeScript; la lógica de la landing se conserva. Se instalaron las dependencias ya declaradas mediante `npm ci` y se añadió únicamente la fuente `@fontsource-variable/inter`.

Estas comprobaciones son de interfaz; no prueban la API, la base de datos ni la seguridad entre empresas.

## Verificación de Conductores — 15/10/2026

- `npm run build`: pasa con la advertencia de tamaño del bundle de la landing.
- `npx eslint src/main.tsx src/modulos/administracion`: pasa.
- El lint global conserva el error anterior de `AuthContext.tsx`; no se modifica la autenticación en este incremento.
- Navegador: búsqueda por apellido sin tilde, búsqueda sin coincidencias, limpieza de filtros y filtro de inactivos.
- Registro: cuatro errores al enviar vacío, foco en el primer campo, rechazo de correo inválido, mostrar/ocultar contraseña y mensaje de API pendiente al completar los campos.
- Detalle y edición: datos de referencia, contraseña inicial vacía y opcional al editar, validación sin crear credenciales.
- Diálogos: foco inicial en Cancelar, confirmación sin mutar el ejemplo, cierre con Escape y restauración del foco al botón de origen.
- Revisión visual de escritorio y móvil: listado como ficha y formulario apilado, sin desbordamiento horizontal de la página.
- Regresión tras el traslado: inicio de empresa, listado/formulario de Rutas y Empresas, e imágenes de Empresas cargadas correctamente. No se observaron errores de consola en el recorrido.

La reactivación y las restricciones de eliminación sobre cuentas, asignaciones e historial requieren datos y reglas del backend. No se declaran verificadas en esta vista previa.

## Referencias

## Eliminación de Empresas — 16/10/2026

- `empresas/DialogoEliminarEmpresa.tsx`: confirmación reutilizada por listado y detalle, con nombre y RUC recibidos como propiedades. Los comentarios explican el propósito, el ciclo de foco y el límite de integración.
- Eliminar es definitivo y está separado de Desactivar. Las consecuencias sobre cuentas, rutas, micros y conductores se acordarán con backend; no se presupone eliminación en cascada.
- Confirmar muestra que falta la API. No se elimina el ejemplo ni se alteran relaciones; cerrar desmonta el diálogo y una nueva apertura limpia el aviso.
- Verificado en navegador: apertura desde listado y detalle, foco inicial en Cancelar, confirmación con aviso pendiente, Escape y Cancelar con devolución del foco, nueva apertura sin aviso previo y cambio de estado separado.
- Revisión móvil a 390 × 844 sin desbordamiento horizontal y captura de escritorio a 1440 × 1080. Build y lint del módulo pasan; permanece la advertencia existente de tamaño del bundle.
- La eliminación real, los permisos y las restricciones por dependencias siguen pendientes. T059 no se declara completada.

## Referencias del proyecto

- [T059 · Issue #95](https://github.com/tuChaski/go-tacna-frontend/issues/95).
- [T053 · Página administrativa en Figma](https://www.figma.com/design/Lw9Pbwc65lMKyjsW5IWZaD/go-tacna?node-id=73-1150).
- [T053 · Documentación en revisión](https://github.com/tuChaski/go-tacna-docs/pull/12).
- [T055 · PR pendiente](https://github.com/tuChaski/go-tacna-frontend/pull/117).

## Micros y comentarios de implementación — 15/10/2026

Se añade `micros/` dentro de `src/modulos/administracion/`, con responsabilidades separadas y nombres en español:

- `ListadoMicros.tsx`: búsqueda por código, placa, ruta o conductor; filtro de estado y acciones.
- `FormularioMicro.tsx`: copia temporal de registro/edición, errores por campo y enfoque del primer error.
- `formulario-micro.ts`: tipos locales y validaciones de presencia, empresa, disponibilidad y recorrido.
- `micro-referencia.ts`: ejemplo inmutable y catálogos ficticios relacionados con Rutas y Conductores.
- `ContextoMicro.tsx`: resumen de las selecciones y explicación de la asignación.
- `DetalleMicro.tsx`: datos del micro y enlaces a su ruta y conductor.
- `DialogoMicro.tsx`: confirmación separada de desactivación y eliminación definitiva, con manejo de foco.

Código, placa y ruta activa son obligatorios; conductor es opcional. Un conductor ocupado en otro micro no puede seleccionarse; al editar puede conservarse el actual. El modelo contempla bloquear cambios de ruta/conductor durante un recorrido. La referencia no está en recorrido: ese bloqueo se comprueba por separado en el validador, no con datos operativos reales.

Los comentarios explican el propósito de cada archivo, el estado temporal, el motivo de las restricciones, la validación al enviar y la accesibilidad de las confirmaciones. Se amplían también los comentarios del formulario de Conductores. Las comprobaciones locales no sustituyen permisos ni validaciones atómicas del servidor.

### Novedades consultadas en GitHub

La referencia de OpenAPI vacía descrita arriba corresponde a la revisión anterior. En [docs/main, commit a77e4b5](https://github.com/tuChaski/go-tacna-docs/tree/a77e4b5c63d6deb3cb41dbadf8a794339704103d) ya se integraron el contrato de GPS/WebSocket (PR #11), el kit UI (PR #14) y la navegación en tres toques (PR #10). OpenAPI ahora incluye `/tracking/position` y `/tracking/stop`; todavía no define el CRUD administrativo. El modelo de micro para seguimiento no se utiliza como contrato de registro administrativo.

Las ramas revisadas de backend conservan sus referencias: `main` en `24d437d`, `develop` en `20a921f`, `feature/T035-init-realtime-server` en `dd70932` y `feature/T036-configurar-websocket` en `cf0e647`. El [PR #3 de WebSocket](https://github.com/tuChaski/go-tacna-backend/pull/3) sigue abierto. No se encontraron nuevas ramas del CRUD entre las publicadas. La guía de frontend y el ERD conceptual no cambiaron en esta revisión.

Antes de integrar Micros deben confirmarse los campos y endpoints, unicidad de placa/código, catálogo por empresa, asignación uno a uno, estado de recorrido y restricciones de desactivación/eliminación. Registrar un micro no inicia un recorrido ni activa el GPS.

### Verificación de Micros

- Compilación y lint del módulo: pasan. Continúan la advertencia de tamaño de la landing y el error previo del lint global en `AuthContext.tsx:68`.
- 12 escenarios del validador: campos obligatorios, conductor opcional, conductor disponible/ocupado/inactivo/de otra empresa/inexistente, ruta inactiva/de otra empresa, conservación del conductor actual y restricciones durante recorrido.
- Navegador: búsqueda sin coincidencias y por apellido sin tilde; formulario vacío con tres errores y foco en código; conductor ocupado deshabilitado; envío válido sin conductor con aviso de API pendiente; edición precargada y conductor actual habilitado.
- Eliminación: foco inicial en Cancelar, confirmación sin borrar el ejemplo y Escape con devolución del foco al botón de origen.
- Formulario móvil a 390 px: sin desbordamiento horizontal.

Estas verificaciones son de interfaz y reglas locales; no prueban persistencia, autorización, GPS ni integración con el backend. T059 sigue pendiente de integración.
