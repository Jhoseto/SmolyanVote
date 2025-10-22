import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        react(),
        // ✅ Custom plugin за премахване на index.html от build output
        {
            name: 'no-html-plugin',
            generateBundle(options, bundle) {
                // Изтрий index.html от bundle-a
                delete bundle['index.html'];
            }
        }
    ],

    // Build configuration
    build: {
        // Output в Spring Boot static папката
        outDir: '../src/main/resources/static/svmessenger',
        emptyOutDir: true,

        // Minification и optimization
        minify: 'terser',
        sourcemap: false,

        rollupOptions: {
            // ✅ Direct entry point към main.jsx (без HTML)
            input: resolve(__dirname, 'src/main.jsx'),

            output: {
                // Single bundle files
                entryFileNames: 'svmessenger.js',
                chunkFileNames: 'svmessenger-[name].js',
                assetFileNames: (assetInfo) => {
                    // CSS файлове директно в root
                    if (assetInfo.name && assetInfo.name.endsWith('.css')) {
                        return 'svmessenger.css';
                    }
                    // Други assets (images, fonts, etc.) в подпапка
                    return 'assets/[name].[ext]';
                },

                // Manual chunks за code splitting
                manualChunks: {
                    'vendor': ['react', 'react-dom'],
                    'websocket': ['sockjs-client', '@stomp/stompjs']
                }
            }
        },

        // Chunk size warning limit
        chunkSizeWarningLimit: 1000
    },

    // Dev server configuration
    server: {
        port: 5173,
        open: false,

        // Proxy API calls към Spring Boot
        proxy: {
            '/api': {
                target: 'http://localhost:2662',
                changeOrigin: true,
                secure: false
            },
            '/ws-svmessenger': {
                target: 'ws://localhost:2662',
                ws: true,
                changeOrigin: true
            }
        }
    },

    // Optimization
    optimizeDeps: {
        include: ['react', 'react-dom', 'sockjs-client', '@stomp/stompjs']
    }
});