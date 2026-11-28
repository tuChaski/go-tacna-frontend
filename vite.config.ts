import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev
export default defineConfig({
  // Incluir las escenas locales evita optimizaciones tardías y respuestas 504
  // al abrir QA después de la aplicación. No son entradas del build público.
  optimizeDeps: { entries: ['index.html', 'pruebas/escena-visor.html', 'pruebas/revision-*.html'] },
  worker: { format: 'es' },
  plugins: [
    react(),
    tailwindcss(),
  ],
})
