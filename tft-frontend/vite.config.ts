import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    watch: {
      usePolling: true,
      interval: 300,
    },
    hmr: {
      clientPort: 3000,
    },
    // This is a security risk, but since this is only for local development and I want to be able to access the dev server from other devices on my network, I'm enabling it.
    allowedHosts: true
  },
})
