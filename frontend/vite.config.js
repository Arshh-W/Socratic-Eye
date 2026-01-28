import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 🔹 Any call to /auth or /api will be sent to the backend automatically
      '/auth': {
        target: '',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: '',
        ws: true,
      }
    }
  }
});