import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    // listen on all network interfaces to expose dev server on LAN
    host: true,
    // default port (you can change if needed)
    port: 5173,
    // if port is taken, do not try next port (optional)
    strictPort: false,
  },
})
