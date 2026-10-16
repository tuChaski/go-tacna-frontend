# T059 — Avance de interfaz: Empresas, Rutas, Conductores y Micros

Rama: `feature/T059-crud-admin`, creada desde `origin/develop`.

Revisión más reciente: [matriz de casos y pendientes de cierre — 16/10/2026](./revision-t059.md). Incluye novedades de backend posteriores a las referencias históricas de este documento.

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

En esta fase, confirmar solo muestra que falta la API y no elimina el ejemplo. El backend deberá definir las restricciones por micros asociados, permisos y demás dependencias antes de habilitar la operación real. La opción se añadió a Rutas; no se amplió la eliminación de Empresas en este incremento.

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
