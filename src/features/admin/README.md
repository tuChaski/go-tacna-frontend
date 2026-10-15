# T059 — Avance de interfaz: Empresas y Rutas

Rama: `feature/T059-crud-admin`, creada desde `origin/develop`.

## Revisar las pantallas

Desde la raíz del frontend:

```sh
npm ci
npm run dev
```

Abrir `http://localhost:5173/admin/preview` (o el puerto que indique Vite).

Para el administrador de empresa: `http://localhost:5173/admin/preview/empresa`.
Para Rutas: `http://localhost:5173/admin/preview/empresa/rutas`.
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

Los ejemplos son inmutables. No se escriben datos en `localStorage`, no se llama a endpoints supuestos y no se informa que un registro se guardó. Los valores del formulario solo existen durante la edición y se descartan al salir. Un intento válido de guardar o desactivar muestra que la API sigue pendiente.

En edición, la contraseña comienza vacía y se presenta como cambio opcional; no se carga ninguna contraseña existente.

## Eliminación de rutas acordada con Alex

«Eliminar» representa **borrado definitivo**, separado de «Desactivar», que conserva información. El diálogo identifica la ruta, explica la consecuencia y permite cancelar con botón o Escape. El foco inicial está en Cancelar y se devuelve al botón de origen al cerrar.

En esta fase, confirmar solo muestra que falta la API y no elimina el ejemplo. El backend deberá definir las restricciones por micros asociados, permisos y demás dependencias antes de habilitar la operación real. La opción se añadió a Rutas; no se amplió la eliminación de Empresas en este incremento.

## Organización para revisión del código

- `AdminPreview.tsx`: navegación de revisión e interfaz existente de Empresas.
- `CompanyHome.tsx`: inicio del administrador de empresa.
- `components/`: título accesible y aviso compartido de integración pendiente.
- `routes/RouteList.tsx`: listado, búsqueda y filtros de la referencia.
- `routes/RouteForm.tsx`: registro y edición; estado temporal del formulario.
- `routes/route-form.ts`: tipos, definición de campos y validación de presencia.
- `routes/route-reference.ts`: ejemplo inmutable y rutas de navegación de la vista previa.
- `routes/RouteDetail.tsx`: consulta de datos y acceso a las acciones.
- `routes/RouteContext.tsx`: resumen textual; no representa coordenadas geográficas.
- `routes/RouteActionDialog.tsx`: confirmaciones, foco modal y mensaje pendiente.
- `admin.css`: estilos limitados a la vista administrativa, con secciones comentadas.

Los comentarios explican los límites con la API, las reglas de validación y las decisiones de accesibilidad. El modelo del formulario no pretende definir el contrato del backend.

## Pendiente para completar T059

- Pantallas del administrador de empresa: Micros y Conductores.
- Integración con T029, T030 y T031, y definición del contrato real.
- Datos de la sesión autenticada, roles y aislamiento por empresa comprobados por el servidor.
- Listados reales y estados de carga, vacíos y errores del servicio.
- Guardado, edición, desactivación, reactivación y eliminación definitiva de rutas con persistencia real.
- Unicidad, políticas de contraseñas y formatos oficiales de documentos acordados con la API.
- Asignación conductor–micro, bloqueos por dependencias y comprobación de persistencia al recargar.

El login completo corresponde a T056; la recepción por WebSocket corresponde a T060. Este incremento no declara completada T059.

## Verificación local — 14/10/2026

- `npm run build`: pasa. La landing existente produce una advertencia por el tamaño de su bundle.
- `npx eslint src/main.tsx src/features/admin`: pasa.
- `npm run lint`: queda un error previo de `react-refresh/only-export-components` en `src/context/AuthContext.tsx:68`; su corrección está en el PR de T055 pendiente de integración.
- Revisión en navegador: inicio/listado/detalle/registro/edición; campos vacíos y correo inválido; contraseña visible/oculta; cancelación; apertura y cierre del diálogo y mensaje de estado pendiente; diseño de escritorio y móvil.
- Rutas: navegación desde inicio de empresa; búsqueda sin coincidencias y limpieza de filtros; filtro de inactivas; cuatro errores en formulario vacío y foco en el primero; resumen actualizado al escribir; formulario válido sin persistencia; detalle y edición precargada.
- Diálogos de rutas: confirmación de eliminación y desactivación sin mutar el ejemplo; Cancelar/Escape; foco inicial en Cancelar y restauración al botón de origen.
- Comprobación visual de Rutas en escritorio (1440 × 1080) y móvil (390 × 844 solicitado); sin desbordamiento horizontal de la página. No se observaron errores de consola en el recorrido revisado.

Se retiraron dos imports sin uso (`Navigation` y `ShieldCheck`) de la landing para desbloquear TypeScript; la lógica de la landing se conserva. Se instalaron las dependencias ya declaradas mediante `npm ci` y se añadió únicamente la fuente `@fontsource-variable/inter`.

Estas comprobaciones son de interfaz; no prueban la API, la base de datos ni la seguridad entre empresas.

## Referencias

- [T059 · Issue #95](https://github.com/tuChaski/go-tacna-frontend/issues/95).
- [T053 · Página administrativa en Figma](https://www.figma.com/design/Lw9Pbwc65lMKyjsW5IWZaD/go-tacna?node-id=73-1150).
- [T053 · Documentación en revisión](https://github.com/tuChaski/go-tacna-docs/pull/12).
- [T055 · PR pendiente](https://github.com/tuChaski/go-tacna-frontend/pull/117).
