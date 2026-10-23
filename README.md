# Go Tacna — Frontend

Aplicación web de Go Tacna para el curso Ingeniería Web, construida con React, TypeScript, Vite y Tailwind CSS.

## Ubicación del proyecto

La aplicación está en la **raíz de este repositorio**, donde se encuentra `package.json`. Aunque la descripción original de [T055](https://github.com/tuChaski/go-tacna-frontend/issues/28) menciona `web-admin/`, la estructura existente concentra aquí la aplicación; no es necesario crear otra carpeta ni inicializar otro proyecto.

## Requisitos

- Node.js compatible con las dependencias instaladas. Entorno verificado: **Node.js 24.11.0 y npm 11.6.1**.
- Git para obtener el repositorio y trabajar en una rama por tarea.

## Instalación y ejecución

Desde la raíz del repositorio:

```bash
npm ci
npm run dev
```

Abre la URL que muestre Vite en la terminal, normalmente `http://localhost:5173/`. Si el puerto está ocupado, usa la dirección que indique el servidor. Para detenerlo, presiona `Ctrl+C`.

La raíz muestra la landing pública. En `/login` se accede al backend real; el administrador general entra a `/admin/empresas` y el de empresa a `/admin/empresa/rutas`, con accesos a Conductores y Micros. El panel consulta y guarda en la API de Laravel. Requiere tener el gateway y la base de datos disponibles.

La vista `/admin/preview` conserva los ejemplos de diseño únicamente en desarrollo. Para probar persistencia utiliza el panel después del login. Consulta el [estado y las verificaciones de T059](src/modulos/administracion/README.md) y la [configuración local de autenticación/Docker](src/modulos/autenticacion/README.md).

## Comprobaciones

```bash
npm run build
npm run lint
```

| Comando | Propósito |
| --- | --- |
| `npm run dev` | Iniciar el servidor de desarrollo con actualización al editar. |
| `npm run build` | Comprobar TypeScript y generar la aplicación de producción en `dist/`. |
| `npm run lint` | Revisar el código con ESLint. |
| `npm run test:auth` | Regresiones locales de autenticación. |
| `npm run test:rutas` | Validación del trazado y orden de coordenadas GeoJSON. |
| `npm run test:crud` | Integración con API local; requiere habilitar explícitamente escrituras y credenciales locales, según la documentación de T059. |
| `npm run preview` | Servir localmente el resultado de un build previo. |

Para revisar la compilación en el navegador:

```bash
npm run build
npm run preview
```

Usa la URL que muestre `preview`. Este comando sirve para comprobar el resultado localmente.

### Resultado de la revisión T055 — 13/10/2026

- `npm run dev`: correcto con Vite 8.3.4 en `http://localhost:5173/`.
- `npm run build`: correcto, código de salida 0, con las dependencias ya instaladas.
- `npm run lint`: correcto, código de salida 0, sin errores ni advertencias.
- Tailwind: comprobado visualmente y mediante estilos calculados en `/`: padding de 32 px, fuente de 24 px, peso 700 y altura de línea de 32 px, en un viewport de 526 × 668 px.
- Comprobación de navegación sin sesión: `/admin/` redirige a `/login`; sin errores ni advertencias observados en consola durante esta revisión.

La revisión inicial detectó un error previo de `react-refresh/only-export-components`: `AuthContext.tsx` exportaba el componente `AuthProvider` y el hook `useAuth`. Con autorización de Alex para incluir la corrección en T055, se separaron el contexto compartido en `src/context/auth-context.ts` y el hook en `src/hooks/useAuth.ts`, y se actualizó su importación en `App.tsx`. El proveedor conserva su lógica existente y ESLint mantiene sus reglas activas.

Estos resultados no certifican una instalación limpia, integración con el backend ni pruebas completas de la aplicación o con usuarios.

## Tailwind CSS

Tailwind CSS 4 está integrado mediante `@tailwindcss/vite` en `vite.config.ts`. La hoja `src/index.css` contiene `@import "tailwindcss";` y se importa desde `src/main.tsx`.

La pantalla pública ya utiliza `p-8 text-2xl font-bold`. Para comprobar la integración, abre `/` y verifica en las herramientas de desarrollo que el texto tenga espaciado interno, tamaño aumentado y negrita. Con una raíz de 16 px, los valores esperados son 32 px de padding, 24 px de fuente y peso 700. Si cambia el tamaño raíz, también cambian los valores en píxeles de las utilidades basadas en `rem`.

## API

El cliente HTTP de `src/services/api.ts` utiliza `VITE_API_BASE_URL`. Si no se define, toma `http://localhost:8001/api/v1`.

Para adaptar la dirección a tu entorno, puedes crear un archivo `.env.local`, ignorado por Git:

```dotenv
VITE_API_BASE_URL=http://localhost:8001/api/v1
```

Reinicia Vite después de cambiar esa configuración. Las variables `VITE_*` se incluyen en el cliente: utiliza aquí la URL de la API, nunca contraseñas ni tokens privados. La pantalla provisional y la comprobación visual de Tailwind no requieren iniciar el backend.

## Estructura actual

```text
public/           Recursos públicos
src/assets/       Recursos de la aplicación
src/context/      Contexto de autenticación
src/hooks/        Hooks compartidos
src/services/     Cliente HTTP y servicios
src/types/        Tipos de TypeScript
src/App.tsx       Rutas y pantallas provisionales
src/index.css     Importación de Tailwind y estilos globales
src/main.tsx      Punto de entrada de React
vite.config.ts    Plugins de React y Tailwind
```

## Flujo de trabajo

Las tareas de frontend usan una rama por tarea creada desde `develop`, con PR hacia `develop`. Para T055 corresponde `feature/T055-base-web-admin`. Trabaja únicamente en las tareas asignadas y consulta cualquier ampliación de alcance.

T055 verifica la base React + Vite + Tailwind existente. La implementación del CRUD administrativo corresponde a T059. Las comprobaciones de arranque, compilación, lint y estilos no equivalen a pruebas completas de la aplicación ni a pruebas con usuarios.
