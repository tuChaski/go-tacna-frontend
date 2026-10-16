# T056 — Acceso administrativo, primer avance

Rama: `feature/T056-autenticacion-web`, iniciada desde `develop` después de integrar el avance visual de T059. Esta entrega cubre la pantalla y validaciones del login administrativo por acuerdo con Alex. No completa el registro web ni toda T056.

## Revisión local

Ejecutar `npm run dev` desde la raíz y abrir `/login` en el puerto indicado por Vite. `/login/` también resuelve la pantalla. La ruta existe tanto en desarrollo como en el build; el servidor de despliegue deberá permitir recarga de rutas SPA.

En la vista administrativa de desarrollo, «Salir de la vista» navega a `/login`; no ejecuta logout ni invalida sesiones. Los enlaces «Volver al inicio» y la marca del login regresan a la landing. No se cambia el formulario promocional de la landing.

## Organización y decisiones

- `InicioSesion.tsx`: campos en memoria, validación al salir/corregir/enviar, foco del primer error, mostrar/ocultar y aviso de integración pendiente.
- `Acceso.tsx`: componente de entrada que carga la pantalla de forma diferida y muestra su estado de carga.
- `formulario-acceso.ts`: tipos locales y validación pura de presencia y formato básico de correo; no es un payload del backend.
- `acceso.css`: estilos limitados al módulo, con ajuste de ancho del contenedor del login y adaptación para móvil. Usa Inter ya instalada y lucide-react existente; no añade dependencias ni imágenes remotas.
- `src/main.tsx`: carga diferida de la pantalla para `/login`, manteniendo el montaje existente del resto de la aplicación.

La referencia es [T053 / login en Figma](https://www.figma.com/design/Lw9Pbwc65lMKyjsW5IWZaD/go-tacna?node-id=70-17228), consultada mediante la guía de diseño a código. Alex permite una adaptación moderna: se conserva el propósito, las credenciales y la presentación de Go Tacna. Los botones de selección de perfil del prototipo se omiten porque el backend deberá determinar los permisos; no se ofrece escoger rol ni registro público de administradores.

El correo y la contraseña comienzan vacíos. No se guardan ni se imprimen credenciales; no hay solicitudes de autenticación en esta etapa. Al enviar campos válidos se muestra un aviso explícito sin crear sesión ni abrir panel. La validación de correo ignora espacios exteriores para comprobar formato; la contraseña no se recorta ni se le impone una longitud nueva al acceder a cuentas existentes. El backend determinará su validez real.

## Contrato e integración pendiente

Se revisaron las rutas de autenticación y la migración de usuarios de backend/main en `6cbe163`. El servidor usa `role: admin` sin distinguir aún administrador general y de empresa. Los servicios del frontend también tienen diferencias de nombres y estructura respecto a la respuesta del servidor. Se acordó terminar primero la interfaz; no se inventaron roles, empresa, endpoints ni adaptadores.

Pendientes de T056 o su integración:

1. Confirmar tipos administrativos, empresa asociada y respuestas de login/perfil/logout.
2. Adaptar los servicios existentes y resolver su integración con el proveedor de sesión, considerando el PR T055 pendiente de integración.
3. Conectar autenticación, proteger rutas, restaurar/verificar sesión y definir el cierre real.
4. Añadir carga, prevención de doble envío y errores de credenciales, cuenta desactivada, conexión y servidor cuando exista una operación real.
5. Revisar el resto del alcance de T056: el registro público de usuarios es distinto del acceso de administradores.

No se prueban todavía autorización, persistencia de sesión, cuentas reales ni aislamiento por empresa. El panel T059 sigue siendo una vista previa y no debe tratarse como destino autenticado.

## Verificación

- `npm run build`: pasa; continúa la advertencia de tamaño del bundle de la landing. El login genera su propio archivo diferido con CSS y fuentes locales.
- ESLint de `src/main.tsx`, `src/modulos/autenticacion` y `AdminPreview.tsx`: pasa. El lint global detectó el error previo en `src/context/AuthContext.tsx:68`; su corrección pertenece al PR T055 pendiente de integración.
- Siete aserciones del validador: vacíos, espacios, correo inválido, espacios internos en correo, datos completos, contraseña sin modificación y ausencia de longitud mínima impuesta al login.
- Navegador: dos errores en envío vacío, foco en correo, rechazo de correo inválido, corrección de errores, mostrar/ocultar, envío con Enter, aviso pendiente y limpieza del aviso al cambiar datos.
- Navegación: «Salir de la vista» desde el inicio de empresa abre `/login` con campos vacíos; no se ejecuta logout.
- Inspección visual a 1440 × 1080 y 390 × 844, sin desbordamiento horizontal en móvil. No se observaron errores de consola en el recorrido revisado. No se prueba toda la matriz de navegadores.

Estas comprobaciones no equivalen a pruebas completas de autenticación. No se usaron cuentas reales ni se enviaron credenciales al servidor.
