# T057 · Consulta pública de rutas y micros

Fecha de revisión: 26/11/2026. Rama: `feature/T057-consulta-publica`.
El PR se dirige a `develop`. No se modifica backend ni la aplicación Android.

## Qué se implementó

La página `/mapa` permite buscar rutas por nombre, recorrer las páginas del
catálogo, seleccionar una ruta y consultar sus micros activos. Se abre una
sola ruta y un solo detalle de micro a la vez. El detalle muestra placa,
empresa, ruta, estado reportado y capacidad; la capacidad no se presenta como
ocupación. La consulta no exige iniciar sesión.

La selección vuelve a consultarse al servidor, incluso cuando viene de un
enlace de la landing como `/mapa?ruta=4`. El catálogo permite rutas sin
trazado. Los tamaños de página (8 rutas y 6 micros) son paginación, no límites
del plan del visitante. No se definen cuotas para cuentas gratuitas o Premium.

Se reutiliza el componente SVG de recorridos existente, con su etiqueta
Esquema del recorrido. Solo representa la geometría registrada. El visor
interactivo completo corresponde a T058 y el seguimiento WebSocket a T060.
No se inventan ubicaciones, aforo ni tiempos de llegada. La demostración de
la landing sigue separada; nunca reemplaza un error del catálogo real.

## Revisión previa y diseño

- [T057, issue #93](https://github.com/tuChaski/go-tacna-frontend/issues/93): vista pública de rutas y unidades activas, RF-04 y RF-05.
- Dependencias revisadas: T055 (#28), T025 (#58), T026 (#59) y T051 (#44).
- Figma: archivo Go Tacna, página Passenger App. Se revisaron el selector
  `70:16423` y el detalle `70:16584`, con sus capturas y contexto de diseño.
  [Referencia de Figma](https://www.figma.com/design/Lw9Pbwc65lMKyjsW5IWZaD/go-tacna?node-id=70-16423).
- Se adaptan las tarjetas, azul de marca, estados con texto, tipografía Inter
  y controles grandes a una pantalla web de dos columnas, apilada en móvil.
  Se reutilizan los iconos Lucide instalados. El mapa esquemático del prototipo
  y sus cifras de ETA no se copian como datos reales.

## Organización y protecciones

| Archivo | Responsabilidad |
|---|---|
| `ConsultaPublica.tsx` | Búsqueda, páginas, selección, recorrido y detalle; foco al abrir y cerrar. |
| `contrato-publico.ts` | Valida identidad, estados, geometría y metadatos; conserva solo campos permitidos. |
| `servicio-consulta.ts` | Lecturas cancelables, parámetros y mensajes públicos de error. |
| `useLecturaPublica.ts` | Aísla cada lectura por clave y descarta resultados cancelados o de otra selección. |
| `consulta-publica.css` | Estilos propios, contraste, foco, adaptación y reducción de movimiento. |

`apiPublica` reutiliza la configuración de `src/services/api.ts`, con una
instancia sin interceptores de sesión. No adjunta Authorization ni renueva
el JWT al consultar el catálogo, aunque haya un administrador autenticado.
T102 y el cliente privado se conservan. La landing también usa este cliente
público para sus lecturas.

Se validan las respuestas antes de guardarlas en estado. No se conservan
objetos de usuario/conductor ni historial GPS en el modelo de pantalla. React
renderiza los nombres como texto. No se usa HTML recibido ni enlaces de
paginación proporcionados por el servidor. Eliminar campos en frontend no
reemplaza la autorización ni la minimización de datos que debe hacer la API.

Cada lectura se aborta al cambiar de selección/página o desmontar. Se vuelve a
comprobar el aborto después de recibir la respuesta. La clave de la consulta
impide presentar datos anteriores durante la carga. Buscar otra vez el mismo
texto no genera otra solicitud; Actualizar permite pedir una revisión nueva.
Si una página deja de existir, Reintentar vuelve a la primera. La selección de
ruta se conserva mientras se busca o se actualiza el directorio.

## Verificación realizada

Son pruebas automatizadas y revisión de interfaz realizadas durante el
desarrollo; no se hicieron sesiones con personas de Tacna.

| Comprobación | Resultado |
|---|---|
| Lint y compilación | Correctos. Sigue la advertencia anterior del bundle 3D de la landing, superior a 500 kB. |
| Pruebas de autenticación, sesión y geometría existentes | 57 aprobadas. |
| Contratos públicos y errores nuevos | 23 aprobadas: campos mínimos, estados, geometría, páginas, cancelación, red, HTTP y ausencia de Authorization. |
| API Laravel sin token | 22 solicitudes verificadas; 4 rutas y 4 unidades consultadas sin modificar registros. Incluye búsqueda, detalles, vacíos, 404, páginas y 401 administrativo. |
| Regresión administrativa | 42 solicitudes CRUD y de credenciales del conductor verificadas; se limpiaron solo los registros ficticios de esa ejecución. |
| Navegador con Laravel | Invitado, selección de ruta, detalle, capacidad, cierre, búsqueda sin coincidencias, búsqueda con Enter y enlaces directos. Sin errores de consola en el recorrido final. |
| Foco | Al cerrar el micro vuelve a su botón; al cerrar la ruta vuelve a su tarjeta. |
| Navegador con servidor ficticio | Segunda página de 9 rutas y 7 micros; ruta sin geometría/unidades; detalles retirados con 404; errores 500 de catálogo y unidades; respuesta incompleta y conexión interrumpida. |
| Carga y respuestas tardías | Búsqueda lenta sustituida por otra; se mantiene el resultado nuevo. Cancelación comprobada además con transporte controlado que ignora el aborto. |
| Textos recibidos | `<b>Ruta de prueba</b>` se mostró literalmente; no se insertó un elemento HTML `b`. |
| Adaptación visual | Revisados escritorio de 1440 px, tableta de 768 px y móviles de 390 y 320 px. Se corrigió el mínimo global que causaba 15 px de desbordamiento a 320; el ancho final del documento coincidió con el disponible. |

La demora por timeout y los estados HTTP 401/403/429/500 se cubrieron mediante
transporte controlado. No se apagó la red del equipo ni se ejecutó una auditoría
completa con lector de pantalla. El catálogo totalmente vacío se cubrió con
pruebas de contrato; en navegador se revisó la búsqueda sin coincidencias y
la ruta sin unidades. No se probaron todas las combinaciones posibles.

### Repetir las comprobaciones

Desde la raíz de frontend, con las dependencias instaladas:

```powershell
npm run lint
npm run build
npm run test:publico
npm run test:auth
npm run test:sesion
npm run test:rutas
npm run test:publico:api
```

La integración pública utiliza por defecto `http://127.0.0.1:8001/api/v1` y
solo admite loopback. No necesita credenciales ni permisos de escritura.

Para reproducir los escenarios de interfaz sin tocar Laravel, en una terminal:

```powershell
$env:GOTACNA_SERVIDOR_FICTICIO = '1'
node pruebas/servidor-publico-ficticio.mjs
```

En otra terminal:

```powershell
$env:VITE_API_BASE_URL = 'http://127.0.0.1:8002/api/v1'
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Abrir `http://127.0.0.1:5174/mapa`. Buscar `error500`, `incompleta`, `red`,
`lenta` o `html` reproduce esos escenarios. La ruta 02 no tiene trazado ni
unidades; la 03 devuelve 404; la 04 tiene un micro retirado; la 05 falla al
consultar unidades. Son ejemplos ficticios, sin acceso a la base de datos.
Detener ambas terminales con Ctrl+C y quitar la variable de esa terminal antes
de volver a usar Laravel o compilar:

```powershell
Remove-Item Env:VITE_API_BASE_URL
Remove-Item Env:GOTACNA_SERVIDOR_FICTICIO -ErrorAction SilentlyContinue
```

## Pendientes antes de cerrar T057 y publicar

**La parte de frontend está implementada; la protección pública del servidor
requiere coordinación con backend antes de declarar la tarea completamente cerrada.**

1. Se confirmó sin token que `/micros/activos` y `/micros/{id}` incluyen en
   `conductor_actual.usuario` campos como DNI, correo y teléfono. La pantalla
   los descarta, pero siguen siendo accesibles en la respuesta de red. Backend
   debe definir un recurso público mínimo y retirar esos datos personales.
   También debe revisar el historial `posiciones` incluido en el detalle.
2. La lectura del controlador indica diferencias entre listado y detalle al
   comprobar empresa/ruta activa. Conviene unificar la autorización pública.
   El adaptador rechaza estados incompatibles; eso no soluciona el acceso
   directo a la API. No se cambiaron estados de registros existentes para
   reproducir esta condición.
3. Repetir la integración tras la corrección de backend y acordar qué datos
   del conductor pueden mostrarse públicamente. La interfaz actual no expone
   su identidad ni su contacto.

No se modificaron issues, estados del tablero ni ramas remotas. El commit y
el push quedan a cargo de Alex; usar `Refs: T057`, sin cierre automático.
