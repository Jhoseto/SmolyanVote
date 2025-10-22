import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  // Build configuration
  build: {
    // Output директория в Spring Boot static папката
    outDir: '../src/main/resources/static/svmessenger',
    emptyOutDir: true,
    
    rollupOptions: {
      output: {
        // Single file output names
        entryFileNames: 'svmessenger.js',
        chunkFileNames: 'svmessenger-[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'svmessenger.css';
          }
          return 'svmessenger-[name].[ext]';
        }
      }
    }
  },
  
  // Dev server configuration
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls към Spring Boot
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      // Proxy WebSocket calls
      '/ws-svmessenger': {
        target: 'ws://localhost:8080',
        ws: true
      }
    }
  }
});
