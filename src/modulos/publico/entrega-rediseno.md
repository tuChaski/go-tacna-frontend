# Rediseño de la web pública de Go Tacna

Revisión: 27/11/2026. Rama: `feature/T058-visor-mapa`. Destino previsto: `develop`.
Esta entrega continúa T058 en la misma rama. Git queda a cargo de Alex: no se
crearon ramas, commits, push ni PR durante la implementación.

## Resultado y decisiones

La portada usa una cabecera blanca estable, con Inicio, Rutas, Para empresas,
cuenta según sesión y un único CTA Consultar rutas. En el mapa ese CTA se
sustituye por el indicador de la pantalla actual. El menú móvil se monta al
abrirse, cierra con Escape y devuelve el foco.

El hero presenta “Muévete por Tacna” y una vista breve del recorrido registrado.
La demostración 3D se carga solo al solicitarla y usa exclusivamente datos de
ejemplo. Se retiraron los ETA fijos, la descarga sin destino y las promesas de
seguimiento del footer. Los errores del catálogo real no se sustituyen por mocks.

Las rutas de portada comienzan contraídas. Una sola puede mostrar su detalle,
empresa, esquema y enlace `/mapa?ruta=ID`. Se conserva el nombre publicado y se
asigna un color visual estable por identidad, sin presentarlo como oficial.
No se cuentan puntos como paraderos ni una página de micros como un total.
Los registros llamados PRUEBA se mantienen: su eventual limpieza corresponde
a la administración de los datos, no a un filtro improvisado del frontend.

En escritorio, la consulta tiene búsqueda y resultados en una columna de
320 px; el mapa ocupa la restante. En móvil el orden del DOM es buscador,
mapa y resultados, sin superposiciones ni bloqueo del scroll natural.
La selección incluye acceso a los micros; el detalle de una unidad aparece
junto al mapa, antes del listado. Se conserva foco al abrir y cerrar.
Cambiar rutas o buscar no desmonta el visor; resize no reemplaza la cámara
manual por otro encuadre.

La búsqueda consulta el catálogo del servidor con debounce de 300 ms,
cancelación y descarte de respuestas antiguas. Enter confirma inmediatamente.
Limpiar conserva la ruta seleccionada. Se corrigió una carrera entre limpiar
y paginar: el temporizador no reinicia la página cuando el término ya coincide.

Empresas tiene una sección compacta y acceso por rol. Se retiró “Registrar mi
empresa”, que llevaba al alta de pasajeros. El contacto institucional se
centraliza en [contacto-publico.ts](contacto-publico.ts): teléfono E.164 válido,
WhatsApp solo mediante opción explícita. Está sin configurar y por eso no hay
botones de llamada o WhatsApp. No se publicaron datos personales del administrador.

Registro usa columnas 38/62 en escritorio, presentación cerca del inicio y
campos agrupados: nombres/apellidos, DNI/teléfono, correo completo y claves.
En móvil vuelve a una columna. Login comunica acceso para distintos roles.
Se conserva el payload, validaciones, error por campo, foco, claves visibles,
bloqueo de doble envío, renovación de sesión y redirección por rol.

## Archivos afectados

### Continuación: iconos y herramienta de diseño

Se utilizó el plugin oficial de Figma para preparar
[una referencia editable de iconos](https://www.figma.com/design/h0akCkRIkOEypdBAsatF5A?node-id=3-93).
Se revisaron sus librerías y se reutilizó la familia Lucide ya instalada en el
frontend. El estilo Body encontrado en la librería era de 13 px; se creó una
referencia Inter de 16 px para respetar la tipografía del producto.

La lámina tiene diez SVG como componentes, una muestra reutilizable, variables
de color/espaciado/radio vinculadas al código y diez instancias de iconos.
Se verificaron los SVG editables, la fuente Inter, las instancias y la
composición en una captura de Figma; las tarjetas se alinearon a 160 px.
Los identificadores se conservan en `figma-iconos.json`.

`IconoPublico.tsx` centraliza la familia vectorial y mantiene el trazo visible
en 1.8 px al cambiar de tamaño. La interfaz utiliza 16/20/24 px y 32 px solo
para ilustraciones vacías. Los SVG decorativos no reciben foco ni duplican el
nombre del botón. Las superficies de los beneficios y empresas son uniformes;
se mejoró la alineación de icono/texto en la cabecera y vista previa.
Los controles mantienen sus etiquetas, acciones y áreas táctiles.

Esta referencia es un apoyo de diseño, no una sincronización automática:
cambiar Figma no modifica el frontend ni publica la web. No se usó generación
de imágenes ni se añadieron dependencias.

- `src/modulos/publico/`: cabecera compartida, identidad, contacto y CSS público.
- `src/modulos/inicio/Inicio.tsx`, `componentes/` y `datos/useDatosInicio.ts`:
  portada, catálogo, demo bajo demanda, empresas, cierre y footer.
- `src/modulos/consulta-publica/ConsultaPublica.tsx` y `consulta-publica.css`:
  distribución, búsqueda y selección estable. El motor, proveedor, contrato
  y worker ES de T058 se conservan.
- `src/modulos/consulta-publica/VisorMapaPublico.tsx`: iconos uniformes en
  encuadre, zoom y recuperación, conservando el ciclo de vida del visor.
- `src/modulos/autenticacion/InicioSesion.tsx` y `acceso.css`: composición
  del formulario; sin cambios al servicio de autenticación.
- `pruebas/escena-visor.*`, `revision-visor.mjs`, `revision-publica.*` e
  `identidad-publica.test.mjs`: escenas aisladas y comprobaciones reproducibles.
- `vite.config.ts`: prepara también las dependencias usadas por las escenas
  QA, evitando el 504 Outdated Optimize Dep observado durante la revisión.
  Las escenas no son entradas del build de producción.

## Validación

| Comprobación | Resultado |
| --- | --- |
| Pruebas Node | 108 aprobadas: autenticación 20, sesión 32, rutas administrativas 8, consulta pública 23, motor de mapa 22 e identidad/contacto 3. |
| Interfaz del visor | 61 comprobaciones aprobadas en Chrome con transporte ficticio local. |
| Portada y formularios | 62 comprobaciones aprobadas en la suite ampliada: menú, acordeón, validación, foco, mostrar clave, bloqueo de doble envío, error remoto, catálogo vacío/error y reintento. |
| Comprobación final aislada | Correcta en Chrome 158 headless con perfil temporal: 26 comprobaciones adicionales y 18 capturas de escritorio, móvil, API real y zoom nativo al 200 %. |
| API real local | 22 GET sin token, 4 rutas y 4 unidades, sin modificar registros. Se mantiene el pendiente de privacidad del servidor. |
| Tipos, lint y build | Correctos tras los ajustes finales. |
| Límite de compilación | Vite avisa de chunks mayores de 500 kB en MapLibre/3D. Ambos se cargan de forma diferida; no se añadieron dependencias. |

La suite del visor revisó 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px,
incluido un nombre largo. También 1366×768, 1440×900 y horizontal 844×390;
en los dos tamaños de escritorio verificó el mapa visible al entrar.
Comprueba una sola instancia al cambiar rutas, selección, páginas, foco,
debounce, cancelación efectiva, respuesta tardía, HTML como texto, errores,
marcadores ficticios, fallo de teselas, ausencia/pérdida/restauración de WebGL
y recuperación conservando el detalle.

Son pruebas en tamaños de iframe y navegador de desarrollo, no dispositivos
físicos ni sesiones con personas reales. No se crean cuentas reales ni se
ejecuta CRUD administrativo sobre la base de datos. La regresión de roles,
sesión y rutas administrativas se cubre con sus pruebas de código.
No se afirma una auditoría completa con lector de pantalla.

## Contrato y pendientes

El backend sigue siendo responsable de retirar DNI, correo, teléfono e
historial GPS de las respuestas públicas y de publicar un DTO de posición
autorizado. El adaptador no conserva esos datos, pero eso no elimina su
exposición en la respuesta de red. Alex indicó que por ahora no puede
modificar backend. Las unidades reales conservan `posicion: null` y muestran
“Ubicación no disponible”. No se añadieron sockets, ETA, aforo ni geolocalización.

En la API local se verificaron estas búsquedas de solo lectura:

| Término | Coincidencias |
| --- | --- |
| `10-b` / `10-B` | La misma ruta (ID 9). |
| `10 b` | Ninguna. |
| `Transportes Tacna` | Ninguna; no se anuncia búsqueda por empresa. |
| `Ruta Centro` | Una ruta (ID 4). |
| `rúta` | Ninguna; no se promete equivalencia de acentos. |

Se aplica trim y se envía `search` con paginación, sin eliminar guiones,
reescribir nombres, descargar todo el catálogo ni filtrar solo ocho registros.
Estas observaciones corresponden al conjunto de datos local del 27/11/2026.

Queda pendiente configurar un canal institucional autorizado y validar la
capacidad del proveedor cartográfico para publicación. Los demás antecedentes
de T058 se conservan en [entrega-t058.md](../consulta-publica/entrega-t058.md).
Esta implementación frontend no cierra por sí sola los pendientes del backend.

## Abrir y repetir

Si ya está iniciado Vite en 5173, reutilizarlo. Si no:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

- Inicio: http://127.0.0.1:5173/
- Consulta: http://127.0.0.1:5173/mapa
- Portada y formularios ficticios: http://127.0.0.1:5173/pruebas/revision-publica.html?ejecutar=1
- Visor ficticio: http://127.0.0.1:5173/pruebas/revision-visor.html?ejecutar=1

Las escenas QA solo funcionan en localhost durante desarrollo y no consumen
Laravel ni cuentas reales. Las teselas lisas del visor QA son intencionales.

```powershell
npm.cmd run lint
npm.cmd run test:mapa:tipos
node --test pruebas/autenticacion.test.mjs pruebas/sesion-http.test.mjs pruebas/rutas.test.mjs pruebas/consulta-publica.test.mjs pruebas/visor-mapa.test.mjs pruebas/identidad-publica.test.mjs
npm.cmd run build
npm.cmd run test:publico:api
node pruebas/comprobacion-web.mjs
git diff --check
```

## Git manual y PR

Desde la raíz del frontend; confirmar que sigue siendo la rama indicada.
No incluir `.env`, notas locales de contexto, `node_modules` ni `dist`.

```powershell
git branch --show-current
git status --short
git diff --stat
git diff --check
git diff
git add -- .gitignore vite.config.ts src/modulos/publico src/modulos/inicio src/modulos/autenticacion/InicioSesion.tsx src/modulos/autenticacion/acceso.css src/modulos/consulta-publica/ConsultaPublica.tsx src/modulos/consulta-publica/consulta-publica.css src/modulos/consulta-publica/VisorMapaPublico.tsx src/modulos/consulta-publica/entrega-t058.md pruebas/escena-visor.html pruebas/escena-visor.tsx pruebas/revision-visor.mjs pruebas/identidad-publica.test.mjs pruebas/revision-publica.html pruebas/revision-publica.mjs pruebas/comprobacion-web.mjs
git diff --cached --stat
git diff --cached --check
git diff --cached
git commit -m "feat(ui): reorganiza la web pública de Go Tacna" -m "Simplifica portada y catálogo, prioriza el mapa y equilibra formularios. Refs: T058"
git push -u origin feature/T058-visor-mapa
```

Origen del PR: `feature/T058-visor-mapa`. Base: **develop**.
No asumir que el commit de MapLibre ya está integrado en develop.

Título sugerido: **feat(ui): reorganiza la web pública y la consulta de rutas**

Descripción:

```text
Reorganiza la portada, navegación y catálogo para encontrar una ruta, abrir su
recorrido y consultar sus micros. Presenta el visor MapLibre desde el primer
bloque, conserva su instancia y añade búsqueda al escribir con debounce,
cancelación y descarte de respuestas antiguas. Corrige la carrera entre limpiar
la búsqueda y cambiar de página.

Las tarjetas empiezan contraídas y conservan nombres y colores estables por
identidad. Separa la demostración 3D bajo demanda de los datos públicos, retira
ETA inventados y simplifica empresas y footer. Registro y login comparten la
identidad visual, con formulario adaptable y las mismas validaciones y roles.

Validación: 108 pruebas de código, 61 comprobaciones del visor y 62 de portada
y formularios aprobadas. La comprobación aislada añade 26 verificaciones y 18
capturas: ocho anchos, primer pantallazo, zoom nativo al 200 %, foco, búsqueda,
respuestas tardías y recuperación gráfica. La API local pasó 22 GET sin token.
Ver entrega-rediseno.md para evidencias y límites.

No modifica backend, móvil ni base de datos. Sigue pendiente retirar información
personal de las respuestas públicas y acordar el DTO autorizado de posición.
Las unidades reales muestran Ubicación no disponible. Sin escrituras de prueba
ni despliegue público. Se conservan sesión T102 y Leaflet administrativo.

Refs: T058 (#94)
```

## Cierre de la revisión

La comprobación final está completada. Se resolvió la limitación de la ventana
de Windows ejecutando la aplicación en Chrome headless con un perfil temporal,
sin controlar ventanas o sesiones personales. El ejecutor no instala paquetes
ni cambia la seguridad del navegador. Requirió autorización de ejecución fuera
del sandbox para que pudieran arrancar sus procesos de renderizado.

Se ejecutaron ambas suites completas y se inspeccionaron las capturas. Dos
fallos encontrados se corrigieron sin rediseñar la interfaz: centrar la franja
de beneficios y evitar que el reset tipográfico de la consulta borrara el
estilo del nombre Go Tacna en su cabecera. Se volvieron a comprobar ambos casos
en escritorio y móvil.

El segundo perfil tiene zoom nativo al 200 %. Se confirmó en el navegador
`cssVisualViewport.zoom = 2`, `devicePixelRatio = 2` y ancho de contenido de
720 px dentro de una ventana de 1440 px. Las cuatro pantallas conservaron
acceso al contenido y desplazamiento vertical, sin desbordamiento horizontal.
No se simuló el resultado añadiendo `zoom` al CSS de la aplicación.

La revisión con API real abrió la portada y `/mapa?ruta=4`: calles de Tacna,
recorrido registrado, unidades y atribución. Todas las solicitudes HTTP de la
prueba fueron de lectura; los formularios se probaron con el proveedor ficticio,
sin crear cuentas. La demostración 3D también se abrió y cerró bajo demanda.

Evidencias generadas localmente:

- [Informe visual con 18 capturas](../../../pruebas/resultados-web/index.html).
- [Resultado estructurado](../../../pruebas/resultados-web/informe.json).
- [Suite de portada y formularios](../../../pruebas/resultados-web/revision-publica.txt).
- [Suite del visor](../../../pruebas/resultados-web/revision-visor.txt).

Para repetir, iniciar Vite y ejecutar `node pruebas/comprobacion-web.mjs` con
Node 24 y Chrome instalado en Windows. Se puede indicar otro ejecutable con
`GOTACNA_CHROME` y otro origen local con `GOTACNA_WEB`. El navegador de pruebas
se cierra al terminar; el servidor de Vite que ya estaba iniciado se conserva.
La carpeta `pruebas/resultados-web/` está ignorada en Git y se regenera; no
forma parte de producción. Se conservan las capturas iniciales aportadas por
Alex como referencia de antes. No se probaron dispositivos físicos ni usuarios
reales, y no se realizó una auditoría completa con lector de pantalla.
