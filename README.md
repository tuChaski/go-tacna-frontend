# Go Tacna — Frontend web

Aplicación React, TypeScript y Vite. La web pública y el panel de administración se sirven junto con la API y Socket.IO cuando se usa Docker.

## Abrir la aplicación con Docker

Desde el repositorio hermano `../rutas-en-tiempo-real-infraestructura`:

```bash
sudo systemctl start docker             # Manjaro, si el daemon está apagado
cd ../rutas-en-tiempo-real-infraestructura
cp .env.example .env                    # solo si todavía no existe .env
sudo docker compose up -d --build --wait
```

Abre `http://localhost:8001`. El panel de acceso está en `/login`. Nginx sirve la web en `/`, reenvía `/api/` al gateway Laravel y `/socket.io/` al servidor Node. No ejecutes `npm run dev` para ver la versión construida por Docker. Después de editar el frontend, reconstruye su imagen:

```bash
sudo docker compose up -d --build frontend nginx
```

El build de Docker usa `VITE_API_BASE_URL=/api/v1` y `VITE_WS_URL=http://localhost:8001` definidos en el `.env` de infraestructura. Las variables `VITE_*` se insertan en el bundle durante la compilación; reconstruye si las cambias. Para abrir la web desde otro dispositivo, sigue las instrucciones de red del [README de infraestructura](../rutas-en-tiempo-real-infraestructura/README.md).

## Desarrollo con recarga inmediata

Puedes dejar el backend de Docker encendido y ejecutar Vite en el host desde **este** repositorio:

```bash
npm ci
npm run dev
```

Abre la URL que muestre Vite, normalmente `http://localhost:5173`. El cliente de `src/services/api.ts` usa `VITE_API_BASE_URL`; sin configurarla, llama a `http://localhost:8001/api/v1`. Si necesitas otra dirección, crea un `.env.local` en este repositorio:

```dotenv
VITE_API_BASE_URL=http://localhost:8001/api/v1
```

Reinicia Vite después de cambiar `.env.local`. No pongas contraseñas ni secretos en variables `VITE_*`, porque se incluyen en el navegador. Para detener Vite presiona `Ctrl+C`; Docker continúa ejecutando la API.

## Comandos del frontend

```bash
npm run build       # TypeScript y bundle de producción
npm run lint        # análisis estático
npm run test:auth   # pruebas de autenticación
npm run test:rutas  # comprobación del trazado
```

La integración CRUD de administración dispone de `npm run test:crud`; consulta [sus condiciones de uso](src/modulos/administracion/README.md) antes de ejecutarla. La ruta `/admin/preview` contiene vistas de demostración y no sustituye las pantallas con datos reales tras iniciar sesión.

Si la API no responde, comprueba `http://localhost:8001/api/v1/rutas` y ejecuta `sudo docker compose ps` desde infraestructura. Si el frontend se ve antiguo, reconstruye la imagen `frontend`.
