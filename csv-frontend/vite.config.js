import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://csvanalysis-backend-9u5tnu-3e9c9e-72-61-227-173.traefik.me',
        changeOrigin: true,
      },
    },
  },
  base: "/",
})

