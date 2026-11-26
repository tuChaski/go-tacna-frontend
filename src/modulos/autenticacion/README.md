# T056 — Autenticación y registro web

Actualización T102: la renovación preventiva y los errores HTTP compartidos se describen al final de este documento. Las referencias a ausencia de refresh en la evidencia de T056 corresponden a aquel incremento histórico.

Actualización T059 (23/10/2026): los administradores ahora acceden al panel real de Empresas o de Rutas/Conductores/Micros. La pantalla mínima descrita en la evidencia de T056 corresponde a ese incremento histórico. Ver [integración administrativa](../administracion/README.md).

Implementación en `feature/T056-autenticacion-web`. Contratos revisados: backend/main `be1c4eb` y docs/develop `e35b60f`. Conexión comprobada nuevamente con backend/main `b7c5aa2` e infraestructura/develop `193b72d`, sobre la base frontend/develop `7e33324`.

## Comportamiento

- `/login`: correo y contraseña, mostrar/ocultar, validación local, espera de respuesta, bloqueo de doble envío y errores del servidor.
- `/registro`: alta pública de pasajeros con DNI, nombres, apellidos, teléfono, correo, contraseña y confirmación. No permite escoger rol administrativo.
- `/admin`: inicio de sesión de administrador general, con identidad real.
- `/admin/empresa`: inicio de administrador de empresa, mostrando las empresas que devuelve su perfil. Admite varias empresas sin escoger una por suposición.
- `/cuenta`: confirmación de cuenta de pasajero o conductor. No implementa los módulos públicos de T057 ni el modo conductor móvil.
- Entrar directamente sin sesión lleva al login. Un rol diferente regresa a su propio destino.
- Recargar comprueba el token con `/auth/me`. Ante fallo de conexión, el contenido protegido no se muestra y se ofrece reintentar o salir localmente.
- Cerrar sesión solicita la invalidación al servidor y limpia el dispositivo. Si la API no responde, se informa que no pudo confirmarse la invalidación remota. El cierre se sincroniza entre pestañas del mismo origen.

Los destinos autenticados son una entrada mínima de cuenta, no el CRUD completo. `/admin/preview` conserva el maquetado ficticio de T059, exclusivo de desarrollo. No se presenta su información como datos reales de la cuenta. La integración de operaciones CRUD sigue en T059; el refresco automático de tokens corresponde a T102.

## Contrato y separación de responsabilidades

| Operación | Contrato vigente |
|---|---|
| Login | `POST /auth/login`, cuerpo `{ correo, password }` |
| Registro | `POST /auth/register`, cuerpo `{ dni, nombre, apellido, correo, telefono, password }` |
| Sesión | `{ success: true, data: { usuario, token, tipo: 'bearer' } }` |
| Perfil | `GET /auth/me`, respuesta `{ success: true, data: usuario }` |
| Salida | `POST /auth/logout` con Bearer token |
| Roles | `admin_general`, `admin_empresa`, `pasajero`, `conductor` |

El usuario publica `nombre`, `apellido`, `correo`, `rol` y `activo`. El alcance empresarial se obtiene de `administrador_empresa_perfiles`, incluyendo su empresa. El adaptador selecciona los datos necesarios y rechaza estructuras incompatibles, usuarios inactivos y tokens vacíos; no interpreta el JWT para asignar permisos.

Solo se persiste el token con el mecanismo local existente. No se guarda contraseña ni se confía en una copia persistida del usuario. La API sigue siendo responsable de la autorización y el aislamiento por empresa; la navegación por rol del frontend es una ayuda de interfaz.

El interceptor agrega Bearer y maneja 401 de una sesión vigente mediante un evento. Los 401 de login/registro se muestran como errores de acceso; una respuesta tardía de un token anterior no elimina una sesión nueva. El timeout HTTP es de 15 segundos. No se implementa refresh automático en este incremento.

## Archivos para revisión

- `InicioSesion.tsx`: formularios compartidos, campos temporales, foco del primer error y envío al proveedor.
- `formulario-acceso.ts`: validaciones locales alineadas con LoginRequest/RegisterRequest. No exige DNI de ocho dígitos porque ese formato no aparece en el contrato publicado.
- `errores-acceso.ts`: mensajes controlados de HTTP/red y traducción de errores por campo; no muestra trazas ni respuestas crudas.
- `RutasAcceso.tsx`: rutas y entradas protegidas, identidad y cierre de sesión.
- `destino-sesion.ts`: decisión de navegación por los cuatro roles publicados.
- `Acceso.tsx`: carga diferida del módulo.
- `acceso.css`: presentación adaptable y estilos aislados.
- `src/context/AuthContext.tsx`: validación/restauración de sesión, cambios entre pestañas y descarte de respuestas antiguas.
- `src/services/adaptador-autenticacion.ts`: traducción y comprobación de las estructuras HTTP.
- `src/services/authService.ts`: llamadas HTTP; la política de sesión pertenece al proveedor.
- `pruebas/autenticacion.test.mjs`: regresiones de contrato y validación con datos ficticios, sin red.

La pantalla administrativa parte de T053/Figma y se adapta al estilo moderno autorizado por Alex. Registro utiliza los mismos componentes y las reglas confirmadas del backend.

## Ejecución local

Desde la raíz del frontend:

```powershell
npm ci
npm run dev
```

`VITE_API_BASE_URL` debe apuntar al gateway, incluyendo `/api/v1`. En estas pruebas: `http://localhost:8001/api/v1`. El origen usado por Vite (`http://127.0.0.1:5173` o `http://localhost:5173`) debe estar permitido por CORS del gateway.

Las rutas `/login`, `/registro`, `/cuenta` y `/admin` también se incluyen en el build de producción. El servidor que lo publique debe devolver `index.html` para las rutas SPA.

### Entorno Docker usado para verificar

El arranque inicial con infraestructura/develop `de89fa3` presentó dos obstáculos en esta copia de Windows; la actualización `193b72d` solo cambia el timeout y conserva estos archivos:

1. El Dockerfile del frontend intenta `COPY nginx.conf` desde un contexto donde ese archivo no existe.
2. El script PHP descargado con CRLF no se ejecuta directamente por su shebang de Linux.

Para probar T056 se levantaron solo PostgreSQL, core y gateway, manteniendo Vite en el host. Se creó un override temporal en `$env:TEMP\gotacna-t056.override.yml`, fuera de los repositorios, que publica el gateway en loopback 8001, permite los dos orígenes Vite y normaliza CRLF al ejecutar el entrypoint. No se modificó código de backend ni infraestructura.

Mientras exista ese archivo temporal, desde infraestructura:

```powershell
$entornoT056 = Join-Path $env:TEMP 'gotacna-t056.override.yml'
docker compose -f docker-compose.yml -f $entornoT056 up -d --wait postgres backend gateway
docker compose ps
```

Para detenerlos conservando la BD: `docker compose stop gateway backend postgres`. No usar `down -v` para una parada normal. El entorno conserva sus volúmenes locales. Las cuentas del seeder son solo de demostración; no usar esos datos en producción.

## Verificación — 22/10/2026

### Revisión de conexión después de actualizar backend e infraestructura

Con backend/main `b7c5aa2` e infraestructura/develop `193b72d` ya incorporados por Alex, se recreó únicamente el gateway con el override temporal y se comprobó `CORE_API_TIMEOUT=60`. PostgreSQL, core y gateway quedaron saludables, conservando la BD. El cambio del proxy desactiva redirecciones y aumenta el tiempo de espera; no modifica el contrato de autenticación. El timeout del frontend sigue siendo de 15 segundos.

Se repitieron en el navegador el login del administrador general y de empresa, la recuperación de sesión al recargar, la empresa autorizada del perfil, la redirección del administrador de empresa al intentar entrar en `/admin`, el cierre de sesión de ambos perfiles, el rechazo de acceso directo sin sesión y el mensaje de contraseña incorrecta. Todos funcionaron con el gateway actualizado. Al finalizar se dejó el navegador sin sesión. Esta revisión específica no repitió el registro ni toda la batería anterior; sus resultados se detallan a continuación.

### Verificación inicial del incremento

- `npm run build`: pasa; mantiene la advertencia previa del tamaño del bundle de la landing.
- `npm run lint`: pasa globalmente después de integrar T055.
- `npm run test:auth`: 18 pruebas pasan. Cubren payloads, respuestas, roles, alcance, datos incompatibles, validación y destinos.
- Navegador contra gateway + Laravel + PostgreSQL: acceso de administrador general y de empresa; empresa real del perfil; recarga; redirección por rol y rechazo del acceso directo sin sesión.
- Registro real de una cuenta ficticia de pasajero; confirmación de contraseña; recarga con sesión y bloqueo de destinos administrativos.
- HTTP 401 por contraseña incorrecta; HTTP 403 con la cuenta ficticia desactivada temporalmente; HTTP 422 por DNI/correo duplicados y foco en el primer campo. La cuenta quedó reactivada.
- Gateway detenido temporalmente: mensaje de red en login, bloqueo al restaurar una sesión sin poder verificarla y aviso honesto al salir localmente. Gateway restaurado y saludable al terminar.
- Cerrar sesión en una pestaña devuelve la otra al login.
- Registro revisado a 390 × 844, sin desbordamiento horizontal; evidencia de sesiones reales y registro móvil guardada fuera de Git.

Se ejecutaron también AuthTest y AdminScopeTest del backend: 16 casos, 62 aserciones, sin fallos y con 16 advertencias por ausencia de `.env` en el contenedor. El primer arranque de pruebas heredó PostgreSQL del entorno y reinicializó únicamente la BD local recién creada para esta verificación; se repusieron los datos de demostración. Después se repitió con aislamiento SQLite explícito y se confirmó que PostgreSQL conserva sus seis usuarios locales (cinco de demostración y uno ficticio de T056).

Comando aislado para esas pruebas, desde infraestructura:

```powershell
docker compose exec -T -e APP_ENV=testing -e DB_CONNECTION=sqlite -e DB_DATABASE=:memory: -e DB_URL= -e CACHE_STORE=array -e SESSION_DRIVER=array backend php artisan test --testsuite=Feature --filter='AuthTest|AdminScopeTest'
```

Estas verificaciones no son una auditoría completa de seguridad ni pruebas con usuarios. No se declara conectado el CRUD T059 ni verificado el refresco T102. Antes del cierre administrativo de #92, Alex y el equipo deben revisar este incremento y su PR hacia develop.

También se añadió el enlace «Iniciar sesión» en la cabecera de la landing y se verificó su navegación hasta el acceso. El resto de la landing mantiene su comportamiento existente.

## T102 — Renovación de sesión y errores HTTP

### Qué cambia

La web renueva el token antes de que venza. La comprobación se realiza antes de enviar consultas y mediante un temporizador mientras la cuenta está abierta. También se comprueba al volver a la pestaña o recuperar conexión. La renovación actualiza el token sin desmontar por sí misma el formulario de esa pestaña.

Se utiliza `exp` del JWT únicamente para programar el intento, con hasta un minuto de anticipación. Para tokens de duración corta se usa un margen del 20 % de su duración. La identidad, los roles y las empresas siguen siendo responsabilidad del servidor.

En la API revisada, `POST /auth/refresh` devuelve `{ success: true, data: { token, tipo: 'bearer' } }`, sin un perfil. La renovación invalida el token anterior. La ruta está dentro de `auth:api`, por lo que rechaza un token que ya venció. Se comprueba ese comportamiento contra backend/main `6d7c4a9`; esta entrega no modifica el backend.

- Las consultas simultáneas de una pestaña comparten la misma renovación. Cuando el navegador ofrece Web Locks, también se coordina el intento entre pestañas del mismo origen.
- Una respuesta antigua no reemplaza una sesión nueva. Cerrar sesión cancela la renovación pendiente y limpia el dispositivo antes de esperar la confirmación remota.
- Los rechazos definitivos de autenticación llevan al login con un aviso. Un error de conexión, timeout o error 500 durante refresh conserva el token para permitir recuperación mientras siga vigente.
- Los errores 403, 422, 429 y de servidor se distinguen de una sesión vencida. Los campos inválidos siguen señalándose en sus formularios.
- Si una lectura obtiene 401 de un token que acaba de rotar, puede repetirse una vez con el token actual. Las escrituras no se repiten automáticamente, tampoco ante una respuesta perdida.
- Login y registro no intentan renovar ante credenciales incorrectas. Refresh y logout usan un cliente separado para evitar bucles.

### Archivos del incremento

| Archivo | Responsabilidad |
|---|---|
| `src/services/sesion-http.ts` | Interceptores, coordinación, vencimiento y protección frente a respuestas antiguas |
| `src/services/api.ts` | Conexión del cliente con almacenamiento, eventos, Web Locks y refresh/logout |
| `src/services/adaptador-autenticacion.ts` | Interpretación separada de la respuesta de renovación |
| `src/services/errores-http.ts` | Mensajes HTTP compartidos, sin mostrar respuestas crudas |
| `src/context/AuthContext.tsx` | Sincronización del token, temporizador y aviso de fin de sesión |
| `src/services/authService.ts` | Cierre local inmediato y solicitud de invalidación remota |
| `src/modulos/autenticacion/RutasAcceso.tsx` | Aviso al volver al login por fin de sesión |
| `src/services/administracion.ts` y `errores-acceso.ts` | Uso de mensajes compartidos conservando las validaciones de cada formulario |

### Pruebas ejecutadas

| Verificación | Resultado |
|---|---|
| `npm run test:sesion` | 31 pruebas pasan: renovación, concurrencia, rechazo, red, cancelación, rotación, cierre y respuestas antiguas |
| `npm run test:auth` | Las 18 pruebas existentes pasan |
| `npm run test:rutas` | Las 8 pruebas existentes pasan |
| `npm run lint` | Pasa |
| `npm run build` | Pasa; continúa el aviso existente del tamaño del paquete del mapa 3D |
| API local, administrador general | 13 verificaciones pasan; una renovación para tres consultas simultáneas |
| API local, administrador de empresa | 13 verificaciones pasan; se conservan identidad, rol y vínculos de empresas |

Las 57 pruebas de Node usan respuestas HTTP simuladas y reloj controlado. Las 26 verificaciones de integración sí consultan el gateway y el backend locales: comprueban perfil, catálogos, renovación, invalidación del token anterior, permisos 403, validación 422, acceso incorrecto 401, logout y rechazo del JWT vencido. Son comprobaciones distintas; no se presentan las respuestas simuladas como pruebas contra el servidor.

Para repetir las pruebas automáticas, desde la raíz del frontend:

```powershell
npm run test:sesion
npm run test:auth
npm run test:rutas
npm run lint
npm run build
```

Para repetir la integración, con la API Docker local saludable y las cuentas de demostración disponibles:

```powershell
.\pruebas\ejecutar-sesion-local.ps1
```

El script prepara tokens temporales vigentes, próximos a vencer y vencidos para las dos cuentas administrativas de demostración. Modifica el reloj de Carbon solo dentro del proceso PHP que emite esos tokens; no cambia el reloj del sistema, la duración configurada de las sesiones ni las cuentas. Solo admite un entorno Laravel `local` o `testing` y una API en loopback. No ejecuta migraciones, seeders ni altas/bajas de registros. Al terminar, solicita el cierre de los tokens de prueba y restaura las variables de entorno del proceso. No imprime tokens ni contraseñas.

`npm run test:sesion:api` permite ejecutar la parte Node con JWT temporales ya preparados en `GOTACNA_TOKEN_VIGENTE`, `GOTACNA_TOKEN_CORTO`, `GOTACNA_TOKEN_VENCIDO` y el rol esperado en `GOTACNA_ROL_PRUEBA`; la preparación normal se realiza con el script de PowerShell anterior.

### Validación visual en Chrome

Se revisa la aplicación en `http://localhost:5173` con el gateway y el backend locales. Se utilizan las cuentas administrativas de demostración.

| Caso | Resultado observado |
|---|---|
| Administrador general: acceso y Empresas | Las capturas aportadas por Alex muestran el listado de empresas; la revisión en Chrome confirma el panel cargado |
| Cierre de la sesión general | Aparece la espera de cierre y luego el login con el mensaje «Sesión cerrada» |
| Administrador de empresa | El acceso dirige a Rutas con Transportes Tacna S.A.C. seleccionada; también se abren Micros y Conductores |
| Recarga del panel de empresa | Se recupera la cuenta y se conserva el contexto de empresa |
| Renovación con un formulario abierto | El campo Placa conserva `T102-FORM` mientras cambia el token; la consulta de perfil con el token nuevo devuelve 200 |
| Cierre con dos pestañas | La segunda pestaña muestra «Sesión cerrada» y la primera también regresa al login |

Para comprobar el temporizador sin esperar una hora, se emite desde el backend local un JWT legítimo de la cuenta de demostración de empresa al que le quedan aproximadamente dos minutos. Se instala como credencial temporal en esa pestaña mediante las herramientas de desarrollo. El temporizador de la aplicación realiza la renovación; la comprobación posterior consulta el perfil directamente con el token nuevo, sin provocar otra renovación a través del interceptor.

La comprobación devuelve `renovada: true`, `perfil: 200` y `placa: "T102-FORM"`. El formulario no se envía y el micro de prueba no se guarda. Después se descarta el formulario, se retiran las variables temporales del navegador y se cierran las credenciales de prueba. No se modifica la duración configurada de las sesiones, el reloj del sistema ni el código del backend.

El rechazo de tokens vencidos se comprueba con pruebas automáticas y contra la API; los fallos de conexión se simulan en las pruebas automáticas. No se fuerza visualmente una desconexión ni una suspensión prolongada. Tampoco se presenta esta prueba corta como una observación de una hora de uso continuo.

### Límites de esta entrega

Si el equipo se suspende o pierde conexión hasta después del vencimiento, el backend actual exige iniciar sesión otra vez; la ventana de refresh de la biblioteca no evita el bloqueo de `auth:api`. La programación depende del reloj del dispositivo y de la ejecución de JavaScript del navegador. Sin Web Locks la coordinación es por pestaña. Se comprueba visualmente el cierre compartido, pero no se fuerza en el navegador una renovación simultánea desde dos pestañas; la coordinación de renovación tiene la cobertura automatizada descrita arriba.

La implementación, las pruebas automáticas, la integración y las comprobaciones visuales descritas quedan listas para revisión en `feature/T102-refresco-sesion`. El PR hacia `develop` y la aprobación del equipo siguen pendientes; no se declara T102 cerrada.

Referencias técnicas: [interceptores de Axios](https://axios-http.com/docs/interceptors), [cancelación con AbortController](https://axios-http.com/docs/cancellation), [controlador de autenticación del backend revisado](https://github.com/tuChaski/go-tacna-backend/blob/6d7c4a95def2ff5075ceae553549322d0838a173/gotacna-backend-core/app/Http/Controllers/Api/V1/AuthController.php) y [rutas del backend](https://github.com/tuChaski/go-tacna-backend/blob/6d7c4a95def2ff5075ceae553549322d0838a173/gotacna-backend-core/routes/api.php).
