/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Em desenvolvimento o Vite (porta 5173) repassa /api e /uploads ao Flask,
// assim o navegador vê tudo na mesma origem (cookie de sessão + CSRF funcionam).
const FLASK = process.env.FLASK_URL ?? 'http://127.0.0.1:5001'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': FLASK,
      '/uploads': FLASK,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
