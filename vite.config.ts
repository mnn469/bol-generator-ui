import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // During local dev (npm run dev), forward /api/* to Spring Boot on 8080
    // Same as what Nginx does in Docker — keeps axios.ts clean with no hardcoded URL
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})

