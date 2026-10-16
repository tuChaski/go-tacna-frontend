# Revisión de T059 — 16/10/2026

## Alcance y decisión de cierre

Base revisada: `92e90a5`, rama `feature/T059-crud-admin`. El árbol estaba limpio al iniciar. Esta revisión añade un ajuste de validación y este registro; no ejecuta commit, push, merge ni cierre de issues.

[T059 #95](https://github.com/tuChaski/go-tacna-frontend/issues/95) sigue abierta y asignada a Alex. Solicita módulos CRUD de empresas, rutas, micros y conductores; referencia RF-15..17 y dependencias #28, #62, #63, #64 y #46. No contiene una lista detallada de criterios de aceptación. Las condiciones de cierre de abajo son una propuesta de verificación, no nuevos acuerdos del equipo.

**No cerrar T059 como completada:** las pantallas actuales son una vista previa de desarrollo con ejemplos inmutables. No hay persistencia ni autorización del panel implementadas. Puede presentarse un PR de avance visual hacia `develop`, usando `Refs: #95` y aclarando lo pendiente, sin cierre automático.

## Matriz de revisión

Estados: **Verificado previo** corresponde a las comprobaciones del 14–15/10 registradas en README; no representa una ejecución nueva hoy. **Verificado hoy** identifica la revisión o ejecución del 16/10. **Pendiente** requiere implementación o nueva comprobación. No son pruebas completas con usuarios.

| Caso | Resultado esperado | Estado / evidencia |
|---|---|---|
| Navegación de los cuatro módulos | Listado, creación, detalle y edición accesibles | Verificado previo: README y capturas locales |
| Campos obligatorios | Errores junto al campo y foco en el primero | Verificado previo: formularios de los cuatro módulos |
| Correo incorrecto | Mensaje comprensible sin envío | Verificado previo: Empresas y Conductores |
| Contraseña vacía al crear empresa | Rechazar | Verificado hoy: aserción del validador |
| Contraseña vacía al editar empresa | Conservar la existente | Verificado hoy: aserción del validador |
| Contraseña de solo espacios al editar empresa | Rechazar | Verificado hoy: defecto corregido y aserción |
| Contraseña no vacía con espacios | No recortarla ni alterar su contenido | Verificado hoy: aserción; la política definitiva sigue pendiente |
| Cancelar formulario | Salir sin persistir la copia temporal | Verificado previo |
| Búsqueda sin resultados y por texto sin tilde | Estado vacío y coincidencias correctas | Verificado previo: Conductores y Micros |
| Filtro de inactivos | Mostrar estado vacío con el catálogo activo actual | Verificado previo: Rutas y Conductores; Micros pendiente de comprobación específica |
| Registro de micro sin conductor | Admitir; ruta activa obligatoria | Verificado previo: navegador y validador |
| Conductor ocupado, inactivo o de otra empresa | Rechazar la selección/asignación | Verificado previo: validador; ocupado también en navegador |
| Conservar conductor del micro editado | Permitir | Verificado previo |
| Cambiar asociaciones durante recorrido | Rechazar | Verificado previo solo en validador; interfaz con datos operativos pendiente |
| Eliminar / desactivar | Confirmaciones distintas, Cancelar, Escape, foco y aviso pendiente | Verificado previo: Rutas, Conductores y Micros |
| Eliminación de Empresas | Acordar alcance y consecuencias antes de implementarla | Pendiente; la interfaz solo ofrece cambio de estado |
| Reactivación | Disponible para un registro inactivo | Pendiente: ejemplos activos no cubren el flujo |
| Pantallas pequeñas y escritorio | Controles legibles sin desbordamiento horizontal | Verificado previo; no cubre todos los dispositivos |
| ID inexistente | Pantalla no disponible en la vista previa | Verificado hoy por lectura del enrutador; respuesta 404 de API pendiente |
| Sesión y rol | Rechazar acceso sin sesión o con rol indebido | Pendiente de panel autenticado y API |
| Aislamiento por empresa | No consultar ni mutar registros ajenos incluso manipulando IDs | Pendiente de pruebas contra servidor |
| Crear / editar / borrar y recargar | Cambios persistidos y listados actualizados | Pendiente de CRUD real |
| Duplicados y relaciones concurrentes | Error por campo; asignación uno a uno atómica | Pendiente de API y base de datos |
| Red lenta, desconexión, errores 401/403/404/409/422/500 | Mensaje útil, datos preservados cuando corresponda y recuperación | Pendiente; códigos definitivos a confirmar con backend |
| Doble envío y reintento | No duplicar operaciones ni anunciar éxito falso | Pendiente de integración |
| Borrado con dependencias | Aplicar política acordada sin eliminar datos relacionados por suposición | Pendiente de contrato |

## Novedades de backend

Comprobaciones técnicas de esta revisión: `npm run build` pasa con la advertencia existente de tamaño del bundle de la landing; ESLint local sobre `src/main.tsx` y `src/modulos/administracion` pasa; cuatro aserciones del validador de contraseña de empresa pasan; `git diff --check` no encuentra errores de espacios. No se repitió la revisión visual en navegador hoy ni se ejecutaron pruebas de integración con servidor.

El [commit 6cbe163](https://github.com/tuChaski/go-tacna-backend/commit/6cbe163f9096f43c64aa6747742bca4d7c87091b), ahora en `main`, incorpora autenticación JWT, modelos y migraciones para empresas, rutas, paraderos, micros, conductores y posiciones. Esto reemplaza el estado histórico descrito en el README del 15/10. `develop` permanece en `20a921f` y las dos ramas publicadas de tiempo real no cambiaron.

Las [rutas publicadas](https://github.com/tuChaski/go-tacna-backend/blob/6cbe163f9096f43c64aa6747742bca4d7c87091b/gotacna-backend-core/routes/api.php) incluyen autenticación, consulta pública de rutas/micros y perfil/posición de conductor. No incluyen todavía endpoints administrativos CRUD. Se revisó código remoto, no se arrancó Laravel ni se ejecutaron sus migraciones: no se afirma que el servicio esté operativo.

Desajustes a resolver con el responsable del backend antes de adaptar formularios:

- Micro publica `empresa_id`, `placa` y `activo`; la interfaz también solicita código y ruta.
- Conductor publica `usuario_id`, `micro_id` y `ruta_id`; la interfaz captura además documento y datos de acceso.
- Empresa publica nombre y estado; la interfaz contempla RUC y cuenta administrativa.
- Ruta publica nombre, descripción y trazado; hay que acordar cómo representar las referencias del formulario y el estado activo.

No se eliminaron campos ni se inventaron adaptadores para resolver estas diferencias. Primero se debe confirmar el contrato y la asociación del administrador con su empresa.

## Pasos para cerrar la tarea

1. Revisar el avance visual con Alex y resolver pendientes de interfaz, incluido el alcance de eliminación de Empresas.
2. Confirmar endpoints, campos, permisos, reglas de asignación y borrado con backend.
3. Conectar el panel autenticado y sustituir referencias por servicios reales.
4. Ejecutar los casos pendientes de la matriz, guardar resultados y corregir fallos.
5. Revisar el PR hacia `develop`, obtener aprobación e integración según el flujo del equipo; entonces evaluar el cierre de #95.

El [PR T055 #117](https://github.com/tuChaski/go-tacna-frontend/pull/117) sigue abierto y GitHub informa conflictos de integración. Incluye la corrección del lint previo de autenticación; resolverlo corresponde a su propia rama, mediante los comandos que Alex ejecute manualmente.

Monitoreo/WebSocket se mantiene fuera de este incremento de T059; requiere confirmar la tarea asignada y verificar su servicio real.
