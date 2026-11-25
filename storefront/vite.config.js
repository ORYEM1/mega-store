import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('scheduler')
            ) {
              return 'react-vendor'
            }

            if (id.includes('axios')) {
              return 'axios-vendor'
            }

            if (
              id.includes('zustand')
            ) {
              return 'state-vendor'
            }

            if (
              id.includes('pusher-js') ||
              id.includes('laravel-echo')
            ) {
              return 'realtime-vendor'
            }
          }
        },
      },
    },
  },
})