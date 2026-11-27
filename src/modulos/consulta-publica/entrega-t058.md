# Entrega de T058

Revisión final: 27/11/2026. Rama `feature/T058-visor-mapa`, PR hacia `develop`.
La implementación frontend queda preparada para revisión. El cierre integral
y la publicación siguen condicionados a los pendientes de backend.

## Resultado

Se sustituye el esquema SVG de `/mapa` por un mapa interactivo de Tacna con
MapLibre GL JS 6.19.0 y calles OpenStreetMap. Se mantienen la búsqueda,
paginación, enlace directo, selección única y detalle de T057. Se añaden
validación del trazado, encuadre, zoom, limpieza de recursos y recuperación
ante fallos de teselas o gráficos. Leaflet del panel se conserva.

Consultar [T058.md](T058.md) para proveedor, atribución, configuración y contrato.
Los dos archivos de contexto de la raíz son notas locales y quedan fuera de
los comandos de preparación del commit de esta entrega.

## Verificación realizada

| Comprobación | Resultado |
| --- | --- |
| Pruebas Node | **105 aprobadas**: 20 de autenticación, 32 de sesión, 8 de rutas administrativas, 23 de consulta pública y 22 nuevas del motor del mapa. |
| Tipos de aplicación y escena QA | Correctos mediante build y `test:mapa:tipos`. |
| Lint y `git diff --check` | Correctos. |
| Compilación | Correcta. MapLibre y worker se emiten como recursos locales separados. Sigue la advertencia de chunks de más de 500 kB, también presente en el módulo 3D previo. |
| API Laravel local, sin token | **22 solicitudes** de solo lectura: 4 rutas y 4 unidades, búsqueda, filtros, paginación, vacíos, 404 y protección administrativa 401. No se modificaron registros. |
| Interfaz con transporte ficticio | **38 comprobaciones aprobadas** en Chrome como invitado. No se usan teselas externas ni datos de Laravel en esa escena. |
| Adaptación | 320, 390, 768 y 1440 px sin desbordamiento horizontal; se verificó también el nombre largo en cada ancho y una sola instancia del mapa tras redimensionar. Es emulación de tamaño en iframe, no prueba en dispositivos físicos. |
| Flujo de interfaz | Enlace directo de ruta, páginas de rutas y micros, detalle, foco al abrir/cerrar, ruta sin trazado/unidades, geometría incompatible, 404, 500 y respuesta incompleta. |
| Red y texto | Transporte ficticio interrumpido y recuperado, respuesta lenta sustituida por otra y HTML recibido presentado literalmente. |
| Marcadores | Selección sincronizada con tarjetas probada con posiciones ficticias autorizadas para la escena. No representa GPS de unidades reales. |
| Gráficos y recuperación | Ausencia de WebGL, fallo de teselas, detalle disponible durante el fallo y botón Reintentar que recupera un solo mapa conservando el detalle. Se provocó además pérdida real de contexto con `WEBGL_lose_context` y su restauración. |
| Teclado | Detalle devuelve el foco al botón de origen; Tab desde el canvas sale a la atribución. No se realizó auditoría completa con lector de pantalla. |
| Vista compilada con Laravel | `vite preview` en el origen local habitual, `/mapa?ruta=4`: calles de Tacna, recorrido registrado, atribución y tarjeta real sin posición. Se corrigió y verificó el worker que fallaba en la primera revisión. |

Las pruebas de interfaz se ejecutan desde
`http://127.0.0.1:5173/pruebas/revision-visor.html`, con **Ejecutar comprobaciones
de interfaz**. Los pasos y las condiciones se conservan en los archivos de QA.
Se realizaron comprobaciones de desarrollo, no sesiones con personas reales.

La regresión de sesión y panel se comprueba con sus pruebas existentes y sin
modificar esos módulos. No se repitieron login administrativo y CRUD de escritura
en navegador ni se alteraron registros para provocar errores.

## Pendientes explícitos

1. **Backend** debe retirar DNI, correo, teléfono e historial GPS de las respuestas
   públicas y revisar la coherencia de autorización entre listado y detalle.
   La integración todavía detecta los datos personales. Alex indicó que ese
   trabajo corresponde a backend y que no puede modificarlo por ahora.
2. Acordar el DTO REST de posición pública y su autorización. El adaptador real
   conserva `posicion: null`; las unidades muestran Ubicación no disponible.
   El motor admite coordenadas/fecha validadas, pero no consume campos privados
   ni inventa permisos. Repetir la integración de marcadores con el contrato final.
3. Confirmar la carga prevista y las condiciones del proveedor antes de publicar.
   OSM Standard es un servicio comunitario sin SLA; el visor no reserva capacidad.
4. La auditoría de dependencias de producción del 26/11 detectó un aviso alto
   preexistente en `follow-redirects` 1.16.1, dependencia de Axios:
   [GHSA-mrwp-f3q8-3g9p](https://github.com/advisories/GHSA-mrwp-f3q8-3g9p).
   La misma versión ya estaba en HEAD antes de T058. No se aplicó `audit fix`
   ni se actualizaron paquetes existentes fuera del alcance del mapa.

El frontend no anuncia seguimiento en vivo: WebSocket corresponde a T060.
No cerrar automáticamente T058 ni publicar mientras falten los requisitos de
integración pendientes. Este cambio no modifica backend, móvil o infraestructura.

## Revisión local

Si no hay servidor iniciado, desde la raíz de frontend:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Abrir `http://127.0.0.1:5173/mapa` o `http://127.0.0.1:5173/mapa?ruta=4`.
El enlace de QA solo se sirve desde Vite en desarrollo y no forma parte de `dist`.

## Git manual

Ejecutar desde la raíz del frontend. Confirmar la rama antes de añadir archivos:

```powershell
git branch --show-current
git status --short
git diff --stat
git diff --check
git diff -- package.json package-lock.json vite.config.ts src/modulos/consulta-publica pruebas/consulta-publica.test.mjs
```

Preparar únicamente los archivos de T058 (los nuevos también deben revisarse):

```powershell
git add -- package.json package-lock.json vite.config.ts tsconfig.pruebas.json src/modulos/consulta-publica pruebas/consulta-publica.test.mjs pruebas/visor-mapa.test.mjs pruebas/escena-visor.html pruebas/escena-visor.tsx pruebas/revision-visor.html pruebas/revision-visor.mjs
git diff --cached --stat
git diff --cached --check
git diff --cached
git commit -m "feat(map): integra el visor público con MapLibre" -m "Conserva T057 y añade recorrido validado, controles y recuperación del mapa. Refs: T058"
git push -u origin feature/T058-visor-mapa
```

No añadir `.env`, `node_modules`, `dist` ni las dos notas de contexto locales.
No se ejecutaron estos comandos de modificación de Git durante el desarrollo.

## Propuesta de pull request

Origen: `feature/T058-visor-mapa`. Destino: **develop**.

Título: **feat(map): integra el visor público con MapLibre**

Descripción para copiar:

```text
Sustituye el esquema SVG de /mapa por un mapa interactivo de Tacna con MapLibre
GL JS y OpenStreetMap. Conserva búsqueda, páginas, enlace directo y detalle de
T057. Valida la geometría, añade encuadre y zoom, conserva la cámara manual y
mantiene el listado disponible cuando falla el mapa. Incluye worker ES local,
limpieza de recursos y atribución visible; Leaflet administrativo se conserva.

Validación: lint, build y tipos correctos; 105 pruebas automatizadas aprobadas,
22 solicitudes públicas de integración de solo lectura y 38 comprobaciones de
interfaz con transporte ficticio. Revisados 320/390/768/1440 px, foco, errores,
teselas, ausencia/pérdida/restauración de WebGL y recuperación del mapa. La vista
compilada se revisó también con Laravel y calles reales. No hubo pruebas con
personas reales ni escrituras sobre la base actual.

Pendientes backend: retirar datos personales e historial GPS de respuestas
públicas y confirmar el contrato autorizado de posición. Las unidades reales
muestran Ubicación no disponible; los marcadores solo se probaron con posiciones
ficticias. No implica seguimiento en vivo ni aprobación para despliegue público.
Revisar capacidad del proveedor antes de publicar. Documentación: T058.md y
entrega-t058.md en src/modulos/consulta-publica.

Refs: T058 (#94)
```
